import { BasePreviewStatusType } from "@posty5/core";

export type HtmlHostingStatusType =
    BasePreviewStatusType |
    "fileIsNotFound"; // File not found

export type HtmlHostingSourceType = "file" | "github";