
export const EXPIRY_CATEGORY_META: Record<ExpiryCategoryId, {
    label: string;
    description: string;
    color: "sky" | "teal" | "orange" | "violet";
    accent: string;
}> = {
    test: {
        label: "Expiring Test Access",
        description: "TEST environment temporary access due within 60 days",
        color: "sky",
        accent: "#0ea5e9",
    },
    dev: {
        label: "Expiring Dev Access",
        description: "DEV environment temporary access due within 60 days",
        color: "teal",
        accent: "#14b8a6",
    },
    contractor: {
        label: "Expiring Contractor",
        description: "Contractor temporary access contracts due within 60 days",
        color: "orange",
        accent: "#f97316",
    },
    acting: {
        label: "Expiring Acting Access",
        description: "Temporary / acting position access due within 60 days",
        color: "violet",
        accent: "#8b5cf6",
    },
};


export const EXPIRY_COLOR_CLASSES: Record<string, { card: string; badge: string; btn: string; header: string }> = {
    sky: { card: "border-sky-200 bg-sky-50", badge: "bg-sky-100 text-sky-700 border-sky-200", btn: "bg-sky-600 hover:bg-sky-700", header: "bg-sky-50 border-sky-200" },
    teal: { card: "border-teal-200 bg-teal-50", badge: "bg-teal-100 text-teal-700 border-teal-200", btn: "bg-teal-600 hover:bg-teal-700", header: "bg-teal-50 border-teal-200" },
    orange: { card: "border-orange-200 bg-orange-50", badge: "bg-orange-100 text-orange-700 border-orange-200", btn: "bg-orange-500 hover:bg-orange-600", header: "bg-orange-50 border-orange-200" },
    violet: { card: "border-violet-200 bg-violet-50", badge: "bg-violet-100 text-violet-700 border-violet-200", btn: "bg-violet-600 hover:bg-violet-700", header: "bg-violet-50 border-violet-200" },
};

export type ExpiryCategoryId = "test" | "dev" | "contractor" | "acting";

