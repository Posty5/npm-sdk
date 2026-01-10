export type BasePreviewStatusType =
    "new" | // Newly created, not yet published
    "pending" | // Waiting for moderation
    "rejected" | // Did not pass moderation
    "approved" | // Approved and available for preview
    "fileIsNotFound"; // File not found
;