
export interface CurrentUserDetails {
  serviceNumber?: string | null;
  activeDirectoryUsername?: string | null;
  email?: string | null;
  displayName?: string | null;
  isActive: boolean;
  employeeEmail?: string | null;
  roles?: string[] | null;
  permissions?: string[] | null;
}

export interface AssignRoleRequest {
  appUserId?: number | null;
  serviceNumber?: string | null;
  activeDirectoryUsername?: string | null;
  roleCode?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface ContractorDetails {
  id?: number | null;
  identificationNumber?: string | null;
  surname?: string | null;
  firstName?: string | null;
  emailAddress?: string | null;
  companyName?: string | null;
  responsibleManager?: string | null;
  businessJustification?: string | null;
  startDate: string;
  endDate: string;
  department?: string | null;
  branch?: string | null;
  active?: boolean | null;
  requests?: RequestSummary[] | null;
}

export interface RequestSummary {
  id: number;
  status?: string | null;
  requestType?: string | null;
  environment?: string | null;
  userAccessType?: string | null;
  additionalUserAccess?: string | null;
}

export interface DepartmentDetails {
  id: number;
  code?: string | null;
  name?: string | null;
  isActive: boolean;
  branches?: BranchDetails[] | null;
}

export interface BranchDetails {
  id: number;
  departmentId: number;
  name?: string | null;
  isActive: boolean;
}

export interface DocumentAuditDetails {
  id: number;
  documentId: number;
  dateCreated: string;
  auditType?: string | null;
  documentData?: string | null;
  oldDocumentData?: string | null;
}

export interface DocumentDetails {
  id: number;
  data?: string | null;
  storageKey?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  contentLength?: number | null;
  dateUploaded: string;
  dateModified?: string | null;
  documentType?: string | null;
  documentCategory?: string | null;
  requestId: number;
  active: boolean;
  archived: boolean;
  archivedDate?: string | null;
}

export interface EmployeeDetails {
  emailAddress?: string | null;
  postId: string;
  surname?: string | null;
  firstName?: string | null;
  contactNumber?: string | null;
  serviceNumber?: string | null;
  department?: string | null;
  branch?: string | null;
  designation?: string | null;
  activeDirectoryUsername?: string | null;
  responsibleManager?: string | null;
  requests?: RequestSummary[] | null;
}

export interface USTEmployeeDetails {
  serviceNo?: string | null;
  surname?: string | null;
  secondName?: string | null;
  firstName?: string | null;
  prefName?: string | null;
  title?: string | null;
  initials?: string | null;
  designation?: string | null;
  email?: string | null;
  clusterDesc?: string | null;
  unitDesc?: string | null;
  deptDesc?: string | null;
  branchDesc?: string | null;
  divisionDesc?: string | null;
  sectionDesc?: string | null;
  subSectionDesc?: string | null;
  mangServNo?: string | null;
  managerName?: string | null;
  postNo?: string | null;
  isActive?: string | null;
  userId?: string | null;
  isManager?: boolean;
  reportsToPostId?: string | null;
}

export interface EmployeeManagerDetails {
  id: number;
  managerEmployeeEmail?: string | null;
  employeeEmail?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
}

export interface EnvironmentDetails {
  id: number;
  name?: string | null;
  requiresTraining: boolean;
}

export interface EllipsePositionDetails {
  id: number;
  code?: string | null;
  name?: string | null;
  instance?: string | null;
  district?: string | null;
  isActive: boolean;
}

export interface RequestTypeDetails {
  id: number;
  code?: string | null;
  name?: string | null;
  isActive: boolean;
}

export interface NewRequestDetails {
  requestType?: string | null;
  environmentId?: number | null;
  environment?: string | null;
  userAccessType?: string | null;
  ellipsePosition?: string | null;
  positionToCopy?: string | null;
  menuAccess?: string | null;
  businessJustification?: string | null;
  additionalUserAccess?: string | null;
  startDate: string;
  endDate?: string | null;
  userType?: string | null;
  ellipseUserId?: number | null;
  contractId?: number | null;
  temporaryPosition?: string | null;
  temporaryPostId?: string | null;
  permanentPostId?: string | null;
  submit: boolean;
  contractor?: ContractorDetails | null;
  employee?: EmployeeDetails | null;
}

export interface RequestApproverActionDetails {
  id: number;
  name?: string | null;
  surname?: string | null;
  postId: number;
  serviceNumber: number;
  approverDate: string;
  requestId: number;
  approverType?: string | null;
  actionType?: string | null;
}

export interface RequestDetails {
  id: number;
  requestNumber?: string;
  status: string;

  startDate: string;
  endDate?: string;

  requestedDate: string;

  requestType: string;

  environment?: string | null;
  userAccessType?: string | null;

  ellipsePosition: string;
  positionToCopy?: string | null;
  menuAccess: string;

  businessJustification: string;
  additionalUserAccess: string;

  userType: string;

  employeeEmail?: string | null;
  activeDirectoryUsername?: string | null;
  department?: string | null;
  branch?: string | null;
  serviceNumber?: string | null;
  employeeName?: string | null;

  designation: string | null;

  contractorName?: string | null;
  companyName?: string | null;

  // Contractor master record (populated when userType === "Contractor")
  contractor?: ContractorDetails | null;

  // Contractor master details (populated when userType === "Contractor")
  contractorEmailAddress?: string | null;
  contractorIdentificationNumber?: string | null;
  contractorContactNumber?: string | null;
  contractorDepartment?: string | null;
  contractorBranch?: string | null;
  contractorStartDate?: string | null;
  contractorEndDate?: string | null;
  contractorResponsibleManager?: string | null;
  contractorBusinessJustification?: string | null;

  contractId?: number | null;
  ellipseUserId?: string | null;

  temporaryPosition?: string | null;
  temporaryPostId?: string | null;
  permanentPostId?: string | null;

  lineManagerApproved?: boolean | null;

  deputyHeadApproved?: boolean | null;

  trainingVerified?: boolean | null;
  trainingCompletionDate?: string | null;

  iCTManagerApproved?: boolean | null;

  hCSystemsAdminApproved?: boolean | null;

  mandatoryInformationVerified?: boolean | null;
  contractorDocumentsVerified?: boolean | null;

  rejectionReason?: string | null;

  missingDocuments?: boolean | null;

  amendmentReason?: string | null;
  documentsRequested?: string | null;

  dateAccessGranted?: string | null;
  ellipseUserUpdateDate?: string | null;

  closureOutcome?: string | null;
  implementationComments?: string | null;

  submittedByServiceNumber?: string | null;

  documentResubmissionRequests? : [] | null;
}

export interface ImplementRequestDetails {
  ellipseUserId?: string;
  dateAccessGranted: string;
  ellipseUserUpdateDate?: string | null;
  closureOutcome?: string | null;
  implementationComments?: string | null;
  mandatoryInformationVerified: boolean;
  contractorDocumentsVerified: boolean;
}

export interface ReturnForAmendmentDetails {
  amendmentType?: string | null;
  reason?: string | null;
  documentsRequested?: string | null;
}

export interface RequestApproverActionDetails {
  id: number;
  name?: string | null;
  surname?: string | null;
  postId: number;
  serviceNumber: number;
  approverDate: string;
  requestId: number;
  approverType?: string | null;
  actionType?: string | null;
  rejectionReason?: string | null;
}

export interface AppUserSummary {
  id: number;
  serviceNumber: string | "";
  activeDirectoryUsername?: string | null;
  email?: string | null;
  displayName?: string | null;
  isActive: boolean;
  employeeEmail?: string | null;
  roles?: string[] | null;
}

export interface RoleDetails {
  id: number;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  isActive?: boolean;
  isSystemRole?: boolean;
  assignedUserCount?: number;
  permissions?: string[] | null;
}
export type CreateRoleRequest = {
  code: string;
  name: string;
  description?: string | null;
};

export type UpdateRoleRequest = {
  code: string;
  name: string;
  description?: string | null;
};

export interface UserRoleDetails {
  appUserId: number;
  activeDirectoryUsername?: string | null;
  roleId: number;
  roleCode?: string | null;
  roleName?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  assignedAt: string;
  assignedByUserId?: number | null;
}

export interface AssignRoleRequest {
  appUserId?: number | null;
  serviceNumber?: string | null;
  activeDirectoryUsername?: string | null;
  roleCode?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface NotificationSummary {
  unreadCount: number;
  items?: AppNotificationDetails[] | null;
}

export interface AppNotificationDetails {
  id: number;
  requestId?: number | null;
  requestNumber?: string | null;
  category?: string | null;
  title?: string | null;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Phase1DashboardReport {
  generatedAtUtc: string;
  byStatus?: StatusCountRow[] | null;
  byEnvironment?: EnvironmentCountRow[] | null;
  openRequests: number;
  returnForAmendmentCount: number;
  implementedLast30Days: number;
  rejectedLast30Days: number;
  oldestOpenRequests?: AgingRequestRow[] | null;
}

export interface StatusCountRow {
  status?: string | null;
  count: number;
}

export interface EnvironmentCountRow {
  environment?: string | null;
  count: number;
}

export interface AgingRequestRow {
  requestId: number;
  requestNumber?: string | null;
  status?: string | null;
  environment?: string | null;
  requestedDate: string;
  ageDays: number;
}

export interface AccessRequestReportRow {
  requestId: number;
  requestNumber?: string | null;
  requestType?: string | null;
  environment?: string | null;
  status?: string | null;
  department?: string | null;
  employeeEmail?: string | null;
  contractId?: number | null;
  requestedDate: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ContractorAccessReportRow {
  requestId: number;
  requestNumber?: string | null;
  contractId: number;
  companyName?: string | null;
  contractorName?: string | null;
  environment?: string | null;
  status?: string | null;
  contractStartDate: string;
  contractEndDate: string;
  accessState?: string | null;
}

export interface FlowableTaskDto {
  taskId?: string | null;
  name?: string | null;
  taskDefinitionKey?: string | null;
  processInstanceId?: string | null;
  processDefinitionKey?: string | null;
  requestId?: number | null;
  assignee?: string | null;
  candidateGroups?: string[] | null;
  createTime?: string | null;
}

export interface FlowableHistoryEventDto {
  activityId?: string | null;
  activityName?: string | null;
  activityType?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface FlowableHealthDetails {
  enabled: boolean;
  baseUrl?: string | null;
  reachable: boolean;
  message?: string | null;
}

export interface FlowableSyncReport {
  health?: FlowableHealthDetails;
  rows?: FlowableSyncRow[] | null;
  outOfSyncCount: number;
}

export interface FlowableSyncRow {
  requestId: number;
  requestNumber?: string | null;
  status?: string | null;
  flowableProcessInstanceId?: string | null;
  expectedTaskKey?: string | null;
  currentTaskKey?: string | null;
  currentTaskId?: string | null;
  syncState?: string | null;
  detail?: string | null;
}

export interface FlowableSyncResult {
  requestId: number;
  success: boolean;
  syncState?: string | null;
  message?: string | null;
  processInstanceId?: string | null;
  currentTaskKey?: string | null;
}


