import type { RequestDetails } from "../api";
import { type ExpiryCategoryId } from "../types/dashboard";

export function getExpiryCategoryItems(category: ExpiryCategoryId, requests: RequestDetails[]): RequestDetails[] {
    return requests.filter(r => {
        if (!isExpiringSoon(r)) return false;
        if (category === "test") return r.environment === "TEST";
        if (category === "dev") return r.environment === "DEV";
        // if (category === "contractor") return !!r.userType === "Contractor";
        return (
            r.userAccessType === "Temporary/Acting Position Amendment" ||
            r.userAccessType === "Temporary Position Amendment" ||
            r.userAccessType === "Acting Position Amendment"
        );
    }).sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? ""));
}

export function expiryDaysLeft(date: string, today = new Date()): number {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return Math.ceil((new Date(date).getTime() - start) / 86400000);
}

function isExpiringSoon(r: RequestDetails, withinDays = 60): boolean {
    if (!r.endDate) return false;
    const days = expiryDaysLeft(r.endDate);
    return days >= 0 && days <= withinDays;
}