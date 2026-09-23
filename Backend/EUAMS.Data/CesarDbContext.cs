using EUAMS.Data.Entities.CesarDb;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Data
{
    public class CesarDbContext : DbContext
    {
        public CesarDbContext(DbContextOptions<CesarDbContext> options)
          : base(options)
        { }

        public DbSet<EmailQueueItem> EmailQueue { get; set; }
        public DbSet<EmailAttachmentQueue> EmailAttachmentQueue { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            //Include this to remove cascade deletions.
            //modelBuilder.Conventions.Remove<OneToManyCascadeDeleteConvention>();
            //modelBuilder.Conventions.Remove<ManyToManyCascadeDeleteConvention>();

            // Mapping to Cesar table for queue Item information.
            modelBuilder.Entity<EmailQueueItem>().ToTable("tb_EmailQueue");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.EmailQueueId).HasColumnName("EmailQueueId");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.ApplicationId).HasColumnName("ApplicationId");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.EmailAccountId).HasColumnName("EmailAccountId");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.QueueDateTime).HasColumnName("QueueDateTime");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.ToList).HasColumnName("ToList");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.CcList).HasColumnName("CcList");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.BccList).HasColumnName("BccList");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.Subject).HasColumnName("Subject");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.Body).HasColumnName("Body");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.IsHtml).HasColumnName("IsHtml");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.FailureCount).HasColumnName("FailureCount");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.ReferenceId).HasColumnName("ReferenceId");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.ReferenceTypeId).HasColumnName("ReferenceTypeId");
            modelBuilder.Entity<EmailQueueItem>().Property(o => o.HasAttachments).HasColumnName("HasAttachments");
            modelBuilder.Entity<EmailQueueItem>().HasKey(o => o.EmailQueueId);
            // Mapping to Cesar table for queue Item attachment information.

            modelBuilder.Entity<EmailAttachmentQueue>().ToTable("tb_EmailAttachmentQueue");
            modelBuilder.Entity<EmailAttachmentQueue>().Property(p => p.EmailQueueId).HasColumnName("EmailQueueId");
            modelBuilder.Entity<EmailAttachmentQueue>().Property(p => p.ApplicationId).HasColumnName("ApplicationId");
            modelBuilder.Entity<EmailAttachmentQueue>().Property(p => p.Filename).HasColumnName("Filename");
            modelBuilder.Entity<EmailAttachmentQueue>().Property(p => p.ContentType).HasColumnName("ContentType");
            modelBuilder.Entity<EmailAttachmentQueue>().Property(p => p.Attachment).HasColumnName("Attachment");
            modelBuilder.Entity<EmailAttachmentQueue>().Property(p => p.EmailAttachmentQueueId).HasColumnName("EmailAttachmentQueueId");
        }
    }
}
