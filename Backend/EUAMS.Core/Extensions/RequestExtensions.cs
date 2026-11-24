using EUAMS.Data.Entities;
using EUAMS.Shared.DTOs.Request;
using EUAMS.Shared.Enums;
using EUAMS.Shared.Interfaces;

namespace EUAMS.Core.Extensions
{
    public static class RequestExtensions
    {
        public static RequestDetails ToDetails(this Request request)
        {
            return new RequestDetails
            {
                Id = request.Id,
                RequestNumber = request.RequestNumber,
                Status = request.Status.ToString(),
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                RequestedDate = request.RequestedDate,
                RequestType = request.RequestType,
                Environment = request.Environment,
                UserAccessType = request.UserAccessType,
                EllipsePosition = request.EllipsePosition,
                PositionToCopy = request.PositionToCopy,
                MenuAccess = request.MenuAccess,
                BusinessJustification = request.BusinessJustification,
                AdditionalUserAccess = request.AdditionalUserAccess,
                UserType = request.UserType,
                EmployeeEmail = request.EmployeeEmail ?? request.Contractor?.EmailAddress,
                Department = request.Employee?.Department ?? request.Contractor?.Department,
                Branch = request.Employee?.Branch ?? request.Contractor?.Branch,
                ServiceNumber = request.Employee?.ServiceNumber,
                Designation = request.Employee?.Designation,
                ActiveDirectoryUsername = request.Employee?.ActiveDirectoryUsername,
                EmployeeName = request.Employee is null
                    ? null
                    : $"{request.Employee.FirstName} {request.Employee.Surname}".Trim(),
                ContractorName = request.Contractor is null
                    ? null
                    : $"{request.Contractor.FirstName} {request.Contractor.Surname}".Trim(),
                CompanyName = request.Contractor?.CompanyName,
                ContractId = request.ContractId,
                Contractor = request.Contractor?.ToDetails(),
                EllipseUserId = request.EllipseUserId,
                TemporaryPosition = request.TemporaryPosition,
                TemporaryPostId = request.TemporaryPostId,
                PermanentPostId = request.PermanentPostId,
                LineManagerApproved = request.LineManagerApproved,
                DeputyHeadApproved = request.DeputyHeadApproved,
                TrainingVerified = request.TrainingVerified,
                ICTManagerApproved = request.ICTManagerApproved,
                HCSystemsAdminApproved = request.HCSystemsAdminApproved,
                MandatoryInformationVerified = request.MandatoryInformationVerified,
                ContractorDocumentsVerified = request.ContractorDocumentsVerified,
                RejectionReason = request.RejectionReason,
                MissingDocuments = request.MissingDocuments,
                DateAccessGranted = request.DateAccessGranted,
                EllipseUserUpdateDate = request.EllipseUserUpdateDate,
                ClosureOutcome = request.ClosureOutcome,
                ImplementationComments = request.ImplementationComments,
                SubmittedByServiceNumber = request.SubmittedByServiceNumber,
                DocumentResubmissionRequests = request.DocumentResubmissionRequests?.Select(o => o.DocumentsRequested).ToList()
            };
        }

        public static List<RequestDetails> ToListDetails(this List<Request> requests)
        {
            return requests.Select(request => request.ToDetails()).ToList();
        }

        public static Request ConvertToNewRequest(this NewRequestDetails details, string requestType, ICurrentUserService currentUser)
        {
            var request = new Request
            {
                Status = RequestStatus.PendingApproval.GetDescription(),
                StartDate = details.StartDate,
                EndDate = details.EndDate,
                RequestedDate = DateTime.UtcNow,
                RequestType = requestType,
                Environment = details.Environment,
                UserAccessType = details.UserAccessType,
                EllipsePosition = details.EllipsePosition.Trim(),
                PositionToCopy = details.PositionToCopy,
                MenuAccess = details.MenuAccess.Trim(),
                BusinessJustification = details.BusinessJustification.Trim(),
                AdditionalUserAccess = details.AdditionalUserAccess.Trim(),
                TemporaryPosition = details.TemporaryPosition,
                TemporaryPostId = details.TemporaryPostId,
                PermanentPostId = details.Employee?.PostId,
                EllipseUserId = details.EllipseUserId,
                SubmittedByServiceNumber = currentUser.ServiceNumber,
                UserType = details.UserType
            };

            if(requestType.ToLower().Contains("terminate"))
            {
                request.Status = RequestStatus.HcActionPending.GetDescription();
            }
            else if ((request.UserType == UserType.Contractor.GetDescription() || details.Employee?.ServiceNumber != currentUser.ServiceNumber)
                && request.Environment == Environments.Production.GetDescription())
            {
                request.Status = RequestStatus.TrainingVerificationPending.GetDescription();
            }
            else if ((request.UserType == UserType.Contractor.GetDescription() || details.Employee?.ServiceNumber != currentUser.ServiceNumber)
                && request.Environment != Environments.Production.GetDescription())
            {
                request.Status = RequestStatus.ICTManagerApprovalPending.GetDescription();
            }

            return request;
        }
    }
}