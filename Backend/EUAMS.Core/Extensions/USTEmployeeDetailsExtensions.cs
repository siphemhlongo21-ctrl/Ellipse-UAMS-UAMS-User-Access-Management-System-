using EUAMS.Shared.DTOs.Employee;

namespace EUAMS.Core.Extensions
{
    public static class USTEmployeeDetailsExtensions
    {
        public static USTEmployeeDetails ToDto(this Data.Views.UstEmployeeDetails employeeDetails)
        {
            return new USTEmployeeDetails
            {
                BranchDesc = employeeDetails.BRANCH_DESC,
                ClusterDesc = employeeDetails.CLUSTER_DESC,
                DeptDesc = employeeDetails.DEPT_DESC,
                Designation = employeeDetails.DESIGNATION,
                DivisionDesc = employeeDetails.DIVISION_DESC,
                Email = employeeDetails.EMAIL,
                FirstName = employeeDetails.FIRST_NAME,
                Initials = employeeDetails.INITIALS,
                IsActive = employeeDetails.ISACTIVE,
                IsManager = employeeDetails.ISMANAGER == "Y",
                ManagerName = employeeDetails.MANAGER_NAME,
                MangServNo = employeeDetails.MANGSERVNO,
                PostNo = employeeDetails.POST_NO,
                PrefName = employeeDetails.PREF_NAME,
                ReportsToPostId = employeeDetails.REPORTSTO_POST_ID,
                SecondName = employeeDetails.SECOND_NAME,
                SectionDesc = employeeDetails.SECTION_DESC,
                ServiceNo = employeeDetails.SERVICE_NO,
                SubSectionDesc = employeeDetails.SUB_SECTION_DESC,
                Surname = employeeDetails.SURNAME,
                Title = employeeDetails.TITLE,
                UnitDesc = employeeDetails.UNIT_DESC,
                UserId = employeeDetails.USERID
            };
        }
    }
}
