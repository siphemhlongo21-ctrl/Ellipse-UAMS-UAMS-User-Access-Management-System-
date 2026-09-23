import { FileText, Shield, UserCheck, UserX, UserCog, CalendarRange } from "lucide-react";

export const TYPE_ICONS: Record<string, React.ReactNode> = {
    "New Employee & Create Signon": <UserCheck size={13} />,
    "Primary Position Amendment": <UserCog size={13} />,
    "Secondary Position Amendment": <UserCog size={13} />,
    "Signon-Menu": <Shield size={13} />,
    "Temporary/Acting Position Amendment": <CalendarRange size={13} />,
    "Terminate & Delete Signon": <UserX size={13} />,
    "Terminate Secondary Position": <UserX size={13} />,
    "Update Existing Employee Record Details": <UserCog size={13} />,
    "Other": <FileText size={13} />,
};