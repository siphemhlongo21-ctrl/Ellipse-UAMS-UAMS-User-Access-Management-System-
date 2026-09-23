namespace EUAMS.Shared.Security
{
    public static class PermissionCodes
    {
        public const string RequestCreateSelf = "request.create.self";
        public const string RequestCreateManaged = "request.create.managed";
        public const string RequestCreateServiceAccount = "request.create.service_account";
        public const string RequestTerminateInitiate = "request.terminate.initiate";
        public const string RequestApproveLineManager = "request.approve.line_manager";
        public const string RequestVerifyTraining = "request.verify.training";
        public const string RequestApproveIct = "request.approve.ict";
        public const string RequestImplement = "request.implement";
        public const string RequestReturnForAmendment = "request.return_for_amendment";
        public const string RequestCancel = "request.cancel";
        public const string RequestSearchAll = "request.search.all";
        public const string RequestViewOwn = "request.view.own";
        public const string RequestViewTeam = "request.view.team";
        public const string RequestViewLinked = "request.view.linked";
        public const string DocumentView = "document.view";
        public const string DocumentDownload = "document.download";
        public const string DocumentUpload = "document.upload";
        public const string AdminRolesAssign = "admin.roles.assign";
        public const string AdminLookupsManage = "admin.lookups.manage";
        public const string ReportPhase1 = "report.phase1";
    }
}
