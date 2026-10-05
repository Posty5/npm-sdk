/**
 * Length limits the social-publisher tools check or state, mirrored from the
 * API's post schemas so a model learns them from the tool schema rather than
 * from a refusal.
 */

/** Longest image-post caption the API accepts. */
export const IMAGE_CAPTION_MAX_LENGTH = 8000;

/** Longest YouTube video title. */
export const YOUTUBE_TITLE_MAX_LENGTH = 100;

/** Longest Threads post (Threads' own ceiling). */
export const THREADS_TEXT_MAX_LENGTH = 500;

/** Longest X post, in X's weighted characters (a link counts 23) — stated, not checked here, since the weighting is X's. */
export const TWITTER_TEXT_MAX_WEIGHTED_LENGTH = 280;
