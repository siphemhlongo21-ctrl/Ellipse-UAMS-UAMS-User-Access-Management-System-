using EUAMS.Data.Views;
using Microsoft.EntityFrameworkCore;

namespace EUAMS.Data
{
    public class DLRDbContext : DbContext
    {
        public DLRDbContext(DbContextOptions<DLRDbContext> options)
            : base(options)
        {
        }

        public DbSet<UstEmployeeDetails> DrlEmployeeDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UstEmployeeDetails>()
                .ToView("vw_UST_EmployeeDetails")
                .HasNoKey();
        }
    }
}
