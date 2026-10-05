/** What creating a text or story post answers. */
export interface ICreatePostResult {
  /** The created post's id — `getStatus(_id)` follows it. */
  _id: string;
  /** Connected platforms dropped from the post, with why (e.g. X below the Pro plan). */
  refusedTargets?: { platform: string; reason: string }[];
  /** Platforms whose text was built from the shared caption and cut to fit (X). */
  truncatedTargets?: string[];
  /** Connected platforms that cannot take this post type. */
  skippedPlatforms?: string[];
}
