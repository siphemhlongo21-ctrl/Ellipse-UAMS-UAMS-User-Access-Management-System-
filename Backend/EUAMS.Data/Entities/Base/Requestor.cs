namespace EUAMS.Data.Entities.Base
{
    public abstract class Requestor
    {
        public string Surname { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string Department { get; set; }

        public string Branch { get; set; }

        public abstract string GetEmailAddress();

        public override string ToString()
        {
            return $"{FirstName} {Surname}";
        }
    }
}
