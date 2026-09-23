using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EUAMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitMigration221 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActiveDirectoryUsername = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    EmployeeEmail = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    ServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Contractors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdentificationNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Surname = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmailAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponsibleManager = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BusinessJustification = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Department = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Branch = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contractors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    EmailAddress = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PostId = table.Column<int>(type: "int", nullable: false),
                    Surname = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Department = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Branch = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Designation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActiveDirectoryUsername = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.EmailAddress);
                });

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RequestTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Requests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RequestedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EllipseUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EllipsePosition = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MenuAccess = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BusinessJustification = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Environment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserAccessType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AdditionalUserAccess = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UserType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ContractId = table.Column<int>(type: "int", nullable: true),
                    EmployeeEmail = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    TemporaryPosition = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TemporaryPostId = table.Column<int>(type: "int", nullable: true),
                    PermanentPostId = table.Column<int>(type: "int", nullable: true),
                    PositionToCopy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MissingDocuments = table.Column<bool>(type: "bit", nullable: true),
                    LineManagerApproved = table.Column<bool>(type: "bit", nullable: true),
                    DeputyHeadApproved = table.Column<bool>(type: "bit", nullable: true),
                    TrainingVerified = table.Column<bool>(type: "bit", nullable: true),
                    ICTManagerApproved = table.Column<bool>(type: "bit", nullable: true),
                    HCSystemsAdminApproved = table.Column<bool>(type: "bit", nullable: true),
                    MandatoryInformationVerified = table.Column<bool>(type: "bit", nullable: false),
                    ContractorDocumentsVerified = table.Column<bool>(type: "bit", nullable: false),
                    TrainingCompletionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RequestClosed = table.Column<bool>(type: "bit", nullable: true),
                    HcSystemOfficerApprovalServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LineManagerApprovalServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeputyHeadApprovalServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainingApprovalServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ICTManagerApprovalServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RequestNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClosureOutcome = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EllipseUserUpdateDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SubmittedByServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImplementedByServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateAccessGranted = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ImplementationComments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CancelledByServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Requests_Contractors_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contractors",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Requests_Employees_EmployeeEmail",
                        column: x => x.EmployeeEmail,
                        principalTable: "Employees",
                        principalColumn: "EmailAddress");
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    PermissionId = table.Column<int>(type: "int", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => new { x.RoleId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EffectiveTo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AssignedByServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppNotifications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestId = table.Column<int>(type: "int", nullable: true),
                    Category = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ServiceNumber = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppNotifications_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DocumentResubmissionRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestId = table.Column<int>(type: "int", nullable: false),
                    RequestedByServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DocumentsRequested = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentResubmissionRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentResubmissionRequests_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Data = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    StorageKey = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    FileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: true),
                    ContentType = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    ContentLength = table.Column<long>(type: "bigint", nullable: true),
                    DateUploaded = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateModified = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DocumentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DocumentCategory = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RequestId = table.Column<int>(type: "int", nullable: false),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    Archived = table.Column<bool>(type: "bit", nullable: false),
                    ArchivedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UploadedByServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RetentionExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RequestApproverActions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Surname = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PostId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionerServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RequestId = table.Column<int>(type: "int", nullable: false),
                    ApproverRole = table.Column<int>(type: "int", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestApproverActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestApproverActions_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RequestStatusHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestId = table.Column<int>(type: "int", nullable: false),
                    FromStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ToStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Event = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChangedByServiceNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestStatusHistories_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingVerifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestId = table.Column<int>(type: "int", nullable: false),
                    TrainingCompleted = table.Column<bool>(type: "bit", nullable: false),
                    TrainingCompletionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    VerifiedByName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    VerifiedByServiceNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ActionDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingVerifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingVerifications_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentAccesses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DateAccessed = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AccessedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DocumentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentAccesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentAccesses_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentAudits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentId = table.Column<int>(type: "int", nullable: false),
                    DateCreated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AuditType = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentAudits_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AppUsers",
                columns: new[] { "Id", "ActiveDirectoryUsername", "CreatedAt", "CreatedBy", "DisplayName", "Email", "EmployeeEmail", "IsActive", "LastLoginAt", "LastModifiedAt", "LastModifiedBy", "ServiceNumber" },
                values: new object[,]
                {
                    { 101, "DEV\\euams.employee", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Eve Employee", "employee.demo@ethekwini.gov.za", "employee.demo@ethekwini.gov.za", true, null, null, null, "employee.demo@ethekwini.gov.za" },
                    { 102, "DEV\\euams.lm", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Leo Manager", "lm.demo@ethekwini.gov.za", "lm.demo@ethekwini.gov.za", true, null, null, null, "lm.demo@ethekwini.gov.za" },
                    { 103, "DEV\\euams.training", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Tina Trainer", "training.demo@ethekwini.gov.za", "training.demo@ethekwini.gov.za", true, null, null, null, "training.demo@ethekwini.gov.za" },
                    { 104, "DEV\\euams.ict", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Ian Ict", "ict.demo@ethekwini.gov.za", "ict.demo@ethekwini.gov.za", true, null, null, null, "ict.demo@ethekwini.gov.za" },
                    { 105, "DEV\\euams.hc", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Helen HcSystems", "hc.demo@ethekwini.gov.za", "hc.demo@ethekwini.gov.za", true, null, null, null, "hc.demo@ethekwini.gov.za" },
                    { 106, "DEV\\euams.admin", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Ada Admin", "admin.demo@ethekwini.gov.za", "admin.demo@ethekwini.gov.za", true, null, null, null, "admin.demo@ethekwini.gov.za" }
                });

            migrationBuilder.InsertData(
                table: "Employees",
                columns: new[] { "EmailAddress", "ActiveDirectoryUsername", "Branch", "ContactNumber", "Department", "Designation", "FirstName", "IsActive", "PostId", "ServiceNumber", "Surname" },
                values: new object[,]
                {
                    { "admin.demo@ethekwini.gov.za", "DEV\\euams.admin", "ICT", "0310001006", "Auxiliary services", "System Admin", "Ada", true, 1006, "admin.demo@ethekwini.gov.za", "Admin" },
                    { "employee.demo@ethekwini.gov.za", "DEV\\euams.employee", "Customer Services", "0310001001", "Customer Services", "Clerk", "Eve", true, 1001, "employee.demo@ethekwini.gov.za", "Employee" },
                    { "hc.demo@ethekwini.gov.za", "DEV\\euams.hc", "Administration", "0310001005", "Auxiliary services", "HC Systems Officer", "Helen", true, 1005, "hc.demo@ethekwini.gov.za", "HcSystems" },
                    { "ict.demo@ethekwini.gov.za", "DEV\\euams.ict", "ICT", "0310001004", "Auxiliary services", "ICT Manager", "Ian", true, 1004, "ict.demo@ethekwini.gov.za", "Ict" },
                    { "lm.demo@ethekwini.gov.za", "DEV\\euams.lm", "Customer Services", "0310001002", "Customer Services", "Line Manager", "Leo", true, 1002, "lm.demo@ethekwini.gov.za", "Manager" },
                    { "training.demo@ethekwini.gov.za", "DEV\\euams.training", "SHERQ & Training", "0310001003", "Technical Support", "Training Centre", "Tina", true, 1003, "training.demo@ethekwini.gov.za", "Trainer" }
                });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Active", "Code", "Description", "Name" },
                values: new object[,]
                {
                    { 1, false, "request.create.self", "", "Create own request" },
                    { 2, false, "request.create.managed", "", "Create contractor / new-user / managed requests" },
                    { 3, false, "request.terminate.initiate", "", "Initiate termination request" },
                    { 4, false, "request.approve.line_manager", "", "Line Manager approve/reject" },
                    { 5, false, "request.verify.training", "", "Training verify/unverify" },
                    { 6, false, "request.approve.ict", "", "ICT approve/reject" },
                    { 7, false, "request.implement", "", "Implement access" },
                    { 8, false, "request.return_for_amendment", "", "Return request for amendment" },
                    { 9, false, "request.cancel", "", "Cancel request" },
                    { 10, false, "request.search.all", "", "Search all requests" },
                    { 11, false, "request.view.own", "", "View own requests" },
                    { 12, false, "request.view.team", "", "View team requests" },
                    { 13, false, "request.view.linked", "", "View workflow-linked requests" },
                    { 14, false, "document.view", "", "View documents" },
                    { 15, false, "document.download", "", "Download documents" },
                    { 16, false, "document.upload", "", "Upload documents" },
                    { 17, false, "admin.roles.assign", "", "Assign roles" },
                    { 18, false, "admin.lookups.manage", "", "Manage lookups" },
                    { 19, false, "report.phase1", "", "Phase 1 reports" },
                    { 21, false, "request.create.service_account", "", "Create service-account request" }
                });

            migrationBuilder.InsertData(
                table: "RequestTypes",
                columns: new[] { "Id", "Code", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "NEW", true, "New" },
                    { 2, "AMENDMENT", true, "Amendment" },
                    { 3, "REMOVAL", true, "Removal" },
                    { 4, "TERMINATION", true, "Termination" },
                    { 5, "ACTING", false, "Acting-Responsibility" },
                    { 6, "TEMPORARY", true, "Temporary" },
                    { 7, "PERMANENT", false, "Permanent" },
                    { 8, "UNLOCK", false, "Unlock" },
                    { 9, "NEW_EMPLOYEE", true, "New Employee" },
                    { 10, "CREATE_SIGNON", true, "Create Signon" },
                    { 11, "NEW_EMPLOYEE_CREATE_SIGNON", true, "New Employee & Create Signon" },
                    { 12, "PRIMARY_POS_AMEND", true, "Primary Position Amendment" },
                    { 13, "SECONDARY_POS_AMEND", true, "Secondary Position Amendment" },
                    { 14, "SIGNON_MENU", true, "Signon-Menu" },
                    { 15, "TEMP_POS_AMEND", true, "Temporary Position Amendment" },
                    { 16, "ACTING_POS_AMEND", true, "Acting Position Amendment" },
                    { 17, "TERM_DELETE_SIGNON", true, "Terminate & Delete Signon" },
                    { 18, "TERM_SECONDARY", true, "Terminate Secondary Position" },
                    { 19, "UPDATE_EMPLOYEE_RECORD", true, "Update Existing Employee Record Details" },
                    { 20, "OTHER", true, "Other" }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Code", "CreatedAt", "CreatedBy", "Description", "IsActive", "ModifiedAt", "ModifiedBy", "Name" },
                values: new object[,]
                {
                    { 1, "EMPLOYEE", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Self-service requestor — own requests only", true, null, null, "Employee" },
                    { 2, "LINE_MANAGER", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Contractor/new-user/service-account create; LM approvals", true, null, null, "Line Manager" },
                    { 3, "TRAINING_CENTRE", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Verifies training for Production access", true, null, null, "Training Centre" },
                    { 4, "ICT_MANAGER", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "ICT approval for Test/Development only", true, null, null, "ICT Manager" },
                    { 5, "HC_SYSTEMS_OFFICER", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Implements approved requests; return for amendment; does not initiate", true, null, null, "HC Systems Officer" },
                    { 6, "SYSTEM_ADMIN", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Role assignment and lookup administration", true, null, null, "System Admin" }
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId", "CreatedDate", "IsDeleted" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 9, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 11, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 14, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 15, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 16, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 1, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 2, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 3, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 4, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 9, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 11, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 12, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 14, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 15, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 16, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 21, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 5, 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 13, 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 14, 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 15, 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 6, 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 13, 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 14, 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 15, 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 7, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 8, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 9, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 10, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 13, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 14, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 15, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 16, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 19, 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 1, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 2, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 3, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 4, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 5, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 6, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 7, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 8, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 9, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 10, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 11, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 13, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 14, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 15, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 16, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 17, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 18, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 19, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 21, 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false }
                });

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "Id", "AssignedAt", "AssignedByServiceNumber", "EffectiveFrom", "EffectiveTo", "RoleId", "ServiceNumber" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin.demo@ethekwini.gov.za", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 1, "employee.demo@ethekwini.gov.za" },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin.demo@ethekwini.gov.za", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 2, "lm.demo@ethekwini.gov.za" },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin.demo@ethekwini.gov.za", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 1, "lm.demo@ethekwini.gov.za" },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin.demo@ethekwini.gov.za", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 3, "training.demo@ethekwini.gov.za" },
                    { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin.demo@ethekwini.gov.za", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 4, "ict.demo@ethekwini.gov.za" },
                    { 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin.demo@ethekwini.gov.za", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 5, "hc.demo@ethekwini.gov.za" },
                    { 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin.demo@ethekwini.gov.za", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 6, "admin.demo@ethekwini.gov.za" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_RequestId",
                table: "AppNotifications",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_ServiceNumber_IsRead_CreatedAt",
                table: "AppNotifications",
                columns: new[] { "ServiceNumber", "IsRead", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAccesses_DocumentId",
                table: "DocumentAccesses",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentAudits_DocumentId",
                table: "DocumentAudits",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentResubmissionRequests_RequestId",
                table: "DocumentResubmissionRequests",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_RequestId",
                table: "Documents",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_ActiveDirectoryUsername",
                table: "Employees",
                column: "ActiveDirectoryUsername");

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Code",
                table: "Permissions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RequestApproverActions_RequestId",
                table: "RequestApproverActions",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Requests_ContractId",
                table: "Requests",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Requests_EmployeeEmail",
                table: "Requests",
                column: "EmployeeEmail");

            migrationBuilder.CreateIndex(
                name: "IX_RequestStatusHistories_RequestId",
                table: "RequestStatusHistories",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_RequestTypes_Code",
                table: "RequestTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Code",
                table: "Roles",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainingVerifications_RequestId",
                table: "TrainingVerifications",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles",
                column: "RoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppNotifications");

            migrationBuilder.DropTable(
                name: "AppUsers");

            migrationBuilder.DropTable(
                name: "DocumentAccesses");

            migrationBuilder.DropTable(
                name: "DocumentAudits");

            migrationBuilder.DropTable(
                name: "DocumentResubmissionRequests");

            migrationBuilder.DropTable(
                name: "RequestApproverActions");

            migrationBuilder.DropTable(
                name: "RequestStatusHistories");

            migrationBuilder.DropTable(
                name: "RequestTypes");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "TrainingVerifications");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Requests");

            migrationBuilder.DropTable(
                name: "Contractors");

            migrationBuilder.DropTable(
                name: "Employees");
        }
    }
}
