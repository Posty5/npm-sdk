import {
  ICommentRequest,
  ICommentStatusDTO,
  ICreateImagePostToWorkspaceRequest,
  ICreateSocialPublisherPostRequest,
  ISocialPublisherPostFacebookPagePostDetails,
  ISocialPublisherPostTikTokPostDetails,
  MAX_COMMENT_DELAY_MINUTES,
  MAX_COMMENT_LENGTH,
  MAX_POST_COMMENTS,
} from "@posty5/social-publisher-post";

/**
 * The multi-comment shapes.
 *
 * These are TYPE tests, and they run without an API on purpose: everything the
 * SDK contributes to this feature is a shape and a document, so the thing worth
 * pinning is that the shape compiles, that the deprecated one still compiles,
 * and that the constants say what the server says. The integration suites in
 * this folder need credentials; this one must not.
 *
 * `// @ts-expect-error` is the assertion in several cases below — it fails the
 * BUILD if the error it expects stops happening, which is the only way to test
 * that a type refuses something.
 */
describe("post comments — request shapes", () => {
  it("accepts a list of comments with everything one can carry", () => {
    const request: ICreateSocialPublisherPostRequest = {
      workspaceId: "w1",
      source: "video-file",
      comments: [
        { text: "First, straight away." },
        { text: "Second, an hour later.", delayMinutes: 60 },
        {
          text: "Third, with a picture.",
          imageUrl: "https://cdn.example/picture.jpg",
          postToFacebook: true,
          postToInstagram: false,
          postToYoutube: false,
        },
      ],
    };

    expect(request.comments).toHaveLength(3);
    expect(request.comments![1].delayMinutes).toBe(60);
  });

  it("still accepts the deprecated singular, so nobody's build breaks", () => {
    const request: ICreateSocialPublisherPostRequest = {
      workspaceId: "w1",
      source: "video-file",
      // Deprecated, not removed: one major version of overlap.
      comment: { text: "The old way." },
    };

    expect(request.comment?.text).toBe("The old way.");
  });

  it("offers the list on the image-post request too", () => {
    const request: ICreateImagePostToWorkspaceRequest = {
      workspaceId: "w1",
      caption: "A picture.",
      image: { source: "image-url", externalUrl: "https://cdn.example/a.jpg" },
      comments: [{ text: "Nice one." }],
    };

    expect(request.comments).toHaveLength(1);
  });

  it("takes either an image URL or an uploaded key", () => {
    const byUrl: ICommentRequest = { text: "a", imageUrl: "https://cdn.example/a.jpg" };
    const byKey: ICommentRequest = { text: "a", imageStorageKey: "users/u1/accounts/a1/a.jpg" };

    // Both fields exist and are independent; which one is right is a question
    // about who stored the bytes, and the JSDoc says so.
    expect(byUrl.imageStorageKey).toBeUndefined();
    expect(byKey.imageUrl).toBeUndefined();
  });

  it("refuses a comment with no text", () => {
    // @ts-expect-error — `text` is the one required field on a comment.
    const bad: ICommentRequest = { delayMinutes: 5 };
    expect(bad).toBeDefined();
  });

  it("refuses a field the API does not declare", () => {
    // Joi refuses an undeclared key outright rather than ignoring it, so a
    // typo here would be a 400 rather than a silently dropped option.
    // @ts-expect-error — no such field.
    const bad: ICommentRequest = { text: "a", postToLinkedin: true };
    expect(bad).toBeDefined();
  });

  it("keeps the list a list, not a single object", () => {
    const bad: ICreateSocialPublisherPostRequest = {
      workspaceId: "w1",
      source: "video-file",
      // @ts-expect-error — `comments` is plural in name and in type; a bare
      // object here is the mistake somebody upgrading from `comment` makes.
      comments: { text: "one" },
    };
    expect(bad).toBeDefined();
  });
});

/**
 * The constants, mirrored rather than imported: this package does not depend on
 * the API's, and a second literal is how a client offers six and the server
 * refuses it. If the API's ever change, these are what must change with them.
 */
describe("post comments — the limits", () => {
  it("caps a post at five comments", () => {
    expect(MAX_POST_COMMENTS).toBe(5);
  });

  it("caps a comment at 2200 characters", () => {
    expect(MAX_COMMENT_LENGTH).toBe(2200);
  });

  it("caps a delay at 24 hours", () => {
    expect(MAX_COMMENT_DELAY_MINUTES).toBe(24 * 60);
  });
});

describe("post comments — response shapes", () => {
  it("reads one status per comment, in posting order", () => {
    const facebook: ISocialPublisherPostFacebookPagePostDetails = {
      description: "",
      title: "",
      comments: [
        { order: 0, text: "First", currentStatus: "done", commentURL: "https://fb.test/c1" },
        { order: 1, text: "Second", delayMinutes: 60, currentStatus: "pending" },
      ],
    } as ISocialPublisherPostFacebookPagePostDetails;

    expect(facebook.comments!.map((row) => row.order)).toEqual([0, 1]);
    expect(facebook.comments![0].currentStatus).toBe("done");
  });

  it("keeps the singular block, so a caller written before the list still reads", () => {
    const facebook: ISocialPublisherPostFacebookPagePostDetails = {
      description: "",
      title: "",
      commentInfo: { currentStatus: "done" },
    } as ISocialPublisherPostFacebookPagePostDetails;

    expect(facebook.commentInfo?.currentStatus).toBe("done");
  });

  // TikTok exposes no public comment-posting endpoint, so this is not a failure
  // state — it is the permanent answer, and the type says so on every comment.
  it("reports every TikTok comment as notSupported", () => {
    const tiktok: ISocialPublisherPostTikTokPostDetails = {
      caption: "",
      disable_duet: false,
      disable_stitch: false,
      disable_comment: false,
      privacy_level: "PUBLIC_TO_EVERYONE",
      comments: [
        { order: 0, currentStatus: "notSupported" },
        { order: 1, currentStatus: "notSupported" },
      ],
    } as ISocialPublisherPostTikTokPostDetails;

    expect(tiktok.comments!.every((row) => row.currentStatus === "notSupported")).toBe(true);
  });

  it("carries the origin of a comment copied from the account's defaults", () => {
    const status: ICommentStatusDTO = {
      order: 0,
      text: "Thanks for watching!",
      defaultCommentId: "d1",
      currentStatus: "done",
    };

    expect(status.defaultCommentId).toBe("d1");
  });
});
