export interface UserSession {
  serviceNumber: string;
  email: string;
  /** AD username entered at login (used for X-AD-Username / request submission) */
  adUsername?: string;
  permissions?: string[];
  roles?: string[];
  displayName: string;
  firstName: string;
  surname: string;
  managerName: string;
  mangServNo: string;
  postNo: string;
  userId: string;
  designation: string;
  branchDesc: string;
  deptDesc: string;
}