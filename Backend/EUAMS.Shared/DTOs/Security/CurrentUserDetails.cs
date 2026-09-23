namespace EUAMS.Shared.DTOs.Security
{
    public class CurrentUserDetails
    {
        public string ServiceNumber { get; set; }

        public string? Email { get; set; }

        public string Surname { get; set; }

        public string FirstName { get; set; }

        public string? DisplayName => $"{FirstName} {Surname}";

        public string DeptDesc { get; set; }

        public string BranchDesc { get; set; }

        public string Designation { get; set; }

        public string UserId { get; set; }

        public string PostNo { get; set; }

        public string MangServNo { get; set; }

        public string ManagerName { get; set; }

        public List<string> Roles { get; set; } = new();

        public List<string> Permissions { get; set; } = new();
    }
}
