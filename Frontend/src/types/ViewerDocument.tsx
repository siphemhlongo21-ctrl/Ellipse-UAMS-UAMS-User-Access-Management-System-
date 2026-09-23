export interface ViewerDocument {
    id?: number | string;
    name: string;
    fileName: string;
    contentType?: string;
    size?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    /** Optional real blob/object URL for preview (PDF/image). Falls back to mock preview. */
    previewUrl?: string | null;
    downloadUrl?: string | null;
    archived?: boolean;
    retentionExpiryDate?: string | null;
}