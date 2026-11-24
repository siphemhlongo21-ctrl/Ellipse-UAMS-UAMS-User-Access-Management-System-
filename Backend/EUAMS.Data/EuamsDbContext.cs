using EUAMS.Data.Entities;

using Microsoft.EntityFrameworkCore;

namespace EUAMS.Data
{
	public class EuamsDbContext : DbContext
	{
		public EuamsDbContext(DbContextOptions<EuamsDbContext> options)
			: base(options)
		{
		}

		public DbSet<Request> Requests { get; set; }

		public DbSet<DocumentAccess> DocumentAccesses { get; set; }

		public DbSet<DocumentAudit> DocumentAudits { get; set; }

		public DbSet<Contractor> Contractors { get; set; }

		public DbSet<RequestApproverAction> RequestApproverActions { get; set; }

		public DbSet<Document> Documents { get; set; }

		public DbSet<Employee> Employees { get; set; }

		public DbSet<RequestType> RequestTypes { get; set; }

		public DbSet<TrainingVerification> TrainingVerifications { get; set; }

		public DbSet<AppUser> AppUsers { get; set; }

		public DbSet<Role> Roles { get; set; }

		public DbSet<Permission> Permissions { get; set; }

		public DbSet<RolePermission> RolePermissions { get; set; }

		public DbSet<UserRole> UserRoles { get; set; }

		public DbSet<RequestStatusHistory> RequestStatusHistories { get; set; }

		public DbSet<DocumentResubmissionRequest> DocumentResubmissionRequests { get; set; }

		public DbSet<AppNotification> AppNotifications { get; set; }

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			modelBuilder.Entity<AppNotification>()
				.HasIndex(x => new { x.ServiceNumber, x.IsRead, x.CreatedAt });

			modelBuilder.Entity<AppNotification>()
				.HasOne(x => x.Request)
				.WithMany()
				.HasForeignKey(x => x.RequestId)
				.OnDelete(DeleteBehavior.SetNull);

			modelBuilder.Entity<RolePermission>()
				.HasKey(x => new { x.RoleId, x.PermissionId });

			modelBuilder.Entity<Role>()
				.Property(x => x.Id)
				.ValueGeneratedNever();

			modelBuilder.Entity<Role>()
				.HasIndex(x => x.Code)
				.IsUnique();

			modelBuilder.Entity<Permission>()
				.Property(x => x.Id)
				.ValueGeneratedNever();

			modelBuilder.Entity<Permission>()
				.HasIndex(x => x.Code)
				.IsUnique();

			modelBuilder.Entity<Employee>()
				.HasIndex(x => x.ActiveDirectoryUsername);

			modelBuilder.Entity<Document>()
				.Property(x => x.IsActive)
				.HasColumnName("Active");

			modelBuilder.Entity<RequestType>()
				.HasIndex(x => x.Code)
				.IsUnique();

			modelBuilder.Entity<TrainingVerification>()
				.HasIndex(x => x.RequestId);

			SeedRequestTypes(modelBuilder);
			SeedRoles(modelBuilder);
			SeedPermissions(modelBuilder);
			SeedRolePermissions(modelBuilder);
		}

		private static void SeedRequestTypes(ModelBuilder modelBuilder)
		{
			// IDs 1–8 retained (inactive) for historical FKs; 9+ match live frontend labels.
			modelBuilder.Entity<RequestType>().HasData(
				new RequestType { Id = 1, Code = "NEW", Name = "New", IsActive = true },
				new RequestType { Id = 2, Code = "AMENDMENT", Name = "Amendment", IsActive = true },
				new RequestType { Id = 3, Code = "REMOVAL", Name = "Removal", IsActive = true },
				new RequestType { Id = 4, Code = "TERMINATION", Name = "Termination", IsActive = true },
				new RequestType { Id = 5, Code = "ACTING", Name = "Acting-Responsibility", IsActive = false },
				new RequestType { Id = 6, Code = "TEMPORARY", Name = "Temporary", IsActive = true },
				new RequestType { Id = 7, Code = "PERMANENT", Name = "Permanent", IsActive = false },
				new RequestType { Id = 8, Code = "UNLOCK", Name = "Unlock", IsActive = false },
				new RequestType { Id = 9, Code = "NEW_EMPLOYEE", Name = "New Employee", IsActive = true },
				new RequestType { Id = 10, Code = "CREATE_SIGNON", Name = "Create Signon", IsActive = true },
				new RequestType { Id = 11, Code = "NEW_EMPLOYEE_CREATE_SIGNON", Name = "New Employee & Create Signon", IsActive = true },
				new RequestType { Id = 12, Code = "PRIMARY_POS_AMEND", Name = "Primary Position Amendment", IsActive = true },
				new RequestType { Id = 13, Code = "SECONDARY_POS_AMEND", Name = "Secondary Position Amendment", IsActive = true },
				new RequestType { Id = 14, Code = "SIGNON_MENU", Name = "Signon-Menu", IsActive = true },
				new RequestType { Id = 15, Code = "TEMP_POS_AMEND", Name = "Temporary Position Amendment", IsActive = true },
				new RequestType { Id = 16, Code = "ACTING_POS_AMEND", Name = "Acting Position Amendment", IsActive = true },
				new RequestType { Id = 17, Code = "TERM_DELETE_SIGNON", Name = "Terminate & Delete Signon", IsActive = true },
				new RequestType { Id = 18, Code = "TERM_SECONDARY", Name = "Terminate Secondary Position", IsActive = true },
				new RequestType { Id = 19, Code = "UPDATE_EMPLOYEE_RECORD", Name = "Update Existing Employee Record Details", IsActive = true },
				new RequestType { Id = 20, Code = "OTHER", Name = "Other", IsActive = true },
				new RequestType { Id = 21, Code = "TERMINATE", Name = "Terminate", IsActive = true },
				new RequestType { Id = 22, Code = "DELETE_SIGNON", Name = "Delete Sign On", IsActive = true },
				new RequestType { Id = 23, Code = "UNLOCK_SIGNON", Name = "Unlocking of Sign On's", IsActive = true });
		}

		private static void SeedRoles(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Role>().HasData(
				new Role { Id = 1, Code = "EMPLOYEE", Name = "Employee", Description = "Self-service requestor — own requests only" },
				new Role { Id = 2, Code = "LINE_MANAGER", Name = "Line Manager", Description = "Contractor/new-user/service-account create; LM approvals" },
				new Role { Id = 3, Code = "TRAINING_CENTRE", Name = "Training Centre", Description = "Verifies training for Production access" },
				new Role { Id = 4, Code = "ICT_MANAGER", Name = "ICT Manager", Description = "ICT approval for Test/Development only" },
				new Role { Id = 5, Code = "HC_SYSTEMS_OFFICER", Name = "HC Systems Officer", Description = "Implements approved requests; return for amendment; does not initiate" },
				new Role { Id = 6, Code = "SYSTEM_ADMIN", Name = "System Admin", Description = "Role assignment and lookup administration" });
		}

		private static void SeedPermissions(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Permission>().HasData(
				new Permission { Id = 1, Code = "request.create.self", Name = "Create own request" },
				new Permission { Id = 2, Code = "request.create.managed", Name = "Create contractor / new-user / managed requests" },
				new Permission { Id = 3, Code = "request.terminate.initiate", Name = "Initiate termination request" },
				new Permission { Id = 4, Code = "request.approve.line_manager", Name = "Line Manager approve/reject" },
				new Permission { Id = 5, Code = "request.verify.training", Name = "Training verify/unverify" },
				new Permission { Id = 6, Code = "request.approve.ict", Name = "ICT approve/reject" },
				new Permission { Id = 7, Code = "request.implement", Name = "Implement access" },
				new Permission { Id = 8, Code = "request.return_for_amendment", Name = "Return request for amendment" },
				new Permission { Id = 9, Code = "request.cancel", Name = "Cancel request" },
				new Permission { Id = 10, Code = "request.search.all", Name = "Search all requests" },
				new Permission { Id = 11, Code = "request.view.own", Name = "View own requests" },
				new Permission { Id = 12, Code = "request.view.team", Name = "View team requests" },
				new Permission { Id = 13, Code = "request.view.linked", Name = "View workflow-linked requests" },
				new Permission { Id = 14, Code = "document.view", Name = "View documents" },
				new Permission { Id = 15, Code = "document.download", Name = "Download documents" },
				new Permission { Id = 16, Code = "document.upload", Name = "Upload documents" },
				new Permission { Id = 17, Code = "admin.roles.assign", Name = "Assign roles" },
				new Permission { Id = 18, Code = "admin.lookups.manage", Name = "Manage lookups" },
				new Permission { Id = 19, Code = "report.phase1", Name = "Phase 1 reports" },
				new Permission { Id = 21, Code = "request.create.service_account", Name = "Create service-account request" });
		}

		private static void SeedRolePermissions(ModelBuilder modelBuilder)
		{
			var mappings = new (int RoleId, int PermissionId)[]
			{
        // EMPLOYEE
        (1, 1), (1, 9), (1, 11), (1, 14), (1, 15), (1, 16),

        // LINE_MANAGER — managed create + own self-service requests + LM approvals
        (2, 1), (2, 2), (2, 3), (2, 4), (2, 9), (2, 11), (2, 12), (2, 14), (2, 15), (2, 16), (2, 21),

        // TRAINING_CENTRE
        (3, 5), (3, 13), (3, 14), (3, 15),

        // ICT_MANAGER
        (4, 6), (4, 13), (4, 14), (4, 15),

        // HC_SYSTEMS_OFFICER
        (5, 7), (5, 8), (5, 9), (5, 10), (5, 13), (5, 14), (5, 15), (5, 16), (5, 19),

        // SYSTEM_ADMIN — admin + full workflow act-as
        (6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6), (6, 7), (6, 8), (6, 9), (6, 10),
		(6, 11), (6, 13), (6, 14), (6, 15), (6, 16), (6, 17), (6, 18), (6, 19), (6, 21),
			};

			modelBuilder.Entity<RolePermission>().HasData(
				mappings.Select(m => new RolePermission
				{
					RoleId = m.RoleId,
					PermissionId = m.PermissionId,
					IsDeleted = false,
					CreatedDate = new DateTime(2026, 1, 1)
				}).ToArray());
		}
	}
}


