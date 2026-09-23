import { type UserRole } from "./UserRole";
import { type ApplicantKind } from ".";


type DirectoryUserStatus = "Active" | "Inactive" | "Locked";

export interface DirectoryUser {
  id: string;
  displayName: string;
  serviceNumber: string;
  email: string;
  department: string;
  branch: string;
  designation: string;
  uamRole: UserRole;
  status: DirectoryUserStatus;
  lastLogin: string;
  applicantKind: ApplicantKind;
  companyName?: string;
}