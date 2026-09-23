import { mapRoleCodesToAppRoles } from "../app/apiBridge";

export function appRoles(roles?: string[] | null): string[] {
    return mapRoleCodesToAppRoles(roles ?? []);
}

export function hasAppRole(roles: string[] | undefined | null, ...wanted: string[]): boolean {
    const mapped = appRoles(roles);
    return wanted.some((role) => mapped.includes(role));
}

export function isEmployeeOnly(roles?: string[] | null): boolean {
    return hasAppRole(roles, "EMPLOYEE") && !hasAppRole(
        roles,
        "LINE_MANAGER",
        "deputy-head",
        "TRAINING_CENTRE",
        "ICT_MANAGER",
        "HC_SYSTEMS_OFFICER",
        "SYSTEM_ADMIN",
    );
}

export function canCreateAccessRequest(roles?: string[] | null): boolean {
    return hasAppRole(roles, "EMPLOYEE", "LINE_MANAGER");
}

export function roleDefaultStatusFilter(roles: string[]): string {
    if (roles?.includes("LINE_MANAGER")) return "Awaiting Line Manager Approval";
    if (roles?.includes("TRAINING_CENTRE")) return "Training Verification Pending";
    if (roles?.includes("ICT_MANAGER")) return "ICT Manager Approval Pending";
    if (roles?.includes("HC_SYSTEMS_OFFICER")) return "Hc Systems Officer Implementation Pending";
    return "all";
}
