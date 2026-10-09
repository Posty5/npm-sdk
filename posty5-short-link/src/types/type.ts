import { ShortLinkDeprecatedRequestKeysConst } from "../short-link.config";

export type ShortLinkStatusType = "new" | "pending" | "rejected" | "approved" | "fileIsNotFound";

/** A request key the client strips before sending (see `ShortLinkDeprecatedRequestKeysConst`). */
export type ShortLinkDeprecatedRequestKeyType = (typeof ShortLinkDeprecatedRequestKeysConst)[number];
