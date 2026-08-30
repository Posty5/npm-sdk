/**
 * Long video SDK surface — unit tests against a mocked HTTP layer.
 *
 * Unlike `social-publisher-post.test.ts`, which talks to the live API and needs
 * credentials, these assert the SDK's own behaviour: the URLs it builds, the
 * bodies it sends, and what it does with what comes back.
 */
import { SocialPublisherPostClient } from "@posty5/social-publisher-post";

type Call = { method: string; url: string; body?: any };

/** Minimal stand-in for HttpClient that records calls and replays queued results. */
function makeHttp(results: any[] = []) {
  const calls: Call[] = [];
  const queue = [...results];
  const next = () => (queue.length ? queue.shift() : {});
  const http: any = {
    calls,
    get: jest.fn(async (url: string) => {
      calls.push({ method: "GET", url });
      return { result: next() };
    }),
    post: jest.fn(async (url: string, body?: any) => {
      calls.push({ method: "POST", url, body });
      return { result: next() };
    }),
    put: jest.fn(async (url: string, body?: any) => {
      calls.push({ method: "PUT", url, body });
      return { result: next() };
    }),
  };
  return http;
}

const UPLOAD_URLS = {
  postId: "post_abc",
  video: { fileURL: "https://cdn.example.com/v.mp4", uploadFileURL: "https://upload.example.com/v", bucketFilePath: "k/v.mp4" },
  thumb: { fileURL: "https://cdn.example.com/t.jpg", uploadFileURL: "https://upload.example.com/t", bucketFilePath: "k/t.jpg" },
};

const CREATED = { _id: "post_abc", durationSeconds: 720, creditUnits: 3, credits: 150, refusedTargets: [] };

/**
 * The uploader is bundled into the package's dist, so mocking the @posty5/core
 * module does not reach it. Mock the transport it actually uses instead — that
 * also keeps the real progress callbacks in play, so the progress assertion
 * tests the shipped code rather than a stub.
 */
const uploadedTo: string[] = [];
beforeEach(() => {
  uploadedTo.length = 0;
  (globalThis as any).fetch = jest.fn(async (url: string) => {
    uploadedTo.push(String(url));
    return { ok: true, status: 200, statusText: "OK" } as any;
  });
});
afterAll(() => {
  delete (globalThis as any).fetch;
});

function videoFile(name = "recording.mp4", type = "video/mp4", size = 50 * 1024 * 1024) {
  const file = new File([new Blob(["x"])], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("getLongVideoQuote", () => {
  it("posts the URL to the quote endpoint and returns the price", async () => {
    const quote = { durationSeconds: 720, maxDurationSeconds: 3600, withinLimit: true, units: 3, creditsPerUnit: 50, credits: 150, isGated: false, platforms: [] };
    const http = makeHttp([quote]);
    const client = new SocialPublisherPostClient(http);

    await expect(client.getLongVideoQuote("https://cdn.example.com/v.mp4")).resolves.toEqual(quote);
    expect(http.calls[0]).toEqual({
      method: "POST",
      url: "/api/social-publisher-post/long-video/quote",
      body: { videoURL: "https://cdn.example.com/v.mp4" },
    });
  });

  it("refuses an empty URL without calling the API", async () => {
    const http = makeHttp();
    const client = new SocialPublisherPostClient(http);
    await expect(client.getLongVideoQuote("")).rejects.toThrow("videoURL is required");
    expect(http.calls).toHaveLength(0);
  });
});

describe("publishLongVideoToWorkspace", () => {
  it("uploads, then creates against the by-file route with the reserved post id", async () => {
    const http = makeHttp([UPLOAD_URLS, CREATED]);
    const client = new SocialPublisherPostClient(http);

    const result = await client.publishLongVideoToWorkspace({
      workspaceId: "ws_1",
      video: videoFile(),
      youtube: { title: "t", description: "d", tags: [] },
    });

    expect(http.calls[0].url).toBe("/api/social-publisher-post/generate-upload-urls");
    // Declaring the type is what buys the early plan/credit refusal.
    expect(http.calls[0].body.postType).toBe("longVideo");
    expect(uploadedTo).toEqual([UPLOAD_URLS.video.uploadFileURL]);
    expect(http.calls[1].url).toBe("/api/social-publisher-post/long-video/workspace/by-file/post_abc");
    expect(http.calls[1].body).toMatchObject({ workspaceId: "ws_1", source: "video-file", videoURL: UPLOAD_URLS.video.fileURL, createdFrom: "npmPackage" });
    expect(result).toEqual(CREATED);
  });

  it("never sends a duration — the server measures it", async () => {
    const http = makeHttp([UPLOAD_URLS, CREATED]);
    const client = new SocialPublisherPostClient(http);
    await client.publishLongVideoToWorkspace({ workspaceId: "ws_1", video: videoFile(), youtube: { title: "t", description: "d", tags: [] } });
    const body = JSON.stringify(http.calls[1].body);
    expect(body).not.toMatch(/duration/i);
  });

  it("requests the video and thumbnail slots in one call, so both share a post folder", async () => {
    const http = makeHttp([UPLOAD_URLS, CREATED]);
    const client = new SocialPublisherPostClient(http);

    await client.publishLongVideoToWorkspace({
      workspaceId: "ws_1",
      video: videoFile(),
      thumbnail: new File([new Blob(["x"])], "t.jpg", { type: "image/jpeg" }),
      youtube: { title: "t", description: "d", tags: [] },
    });

    const uploadUrlCalls = http.calls.filter((c: Call) => c.url.endsWith("generate-upload-urls"));
    expect(uploadUrlCalls).toHaveLength(1);
    expect(uploadUrlCalls[0].body).toMatchObject({ videoFileType: "video/mp4", thumbFileType: "image/jpeg" });
  });

  it("uses the by-url route and skips uploading when given a URL", async () => {
    const http = makeHttp([CREATED]);
    const client = new SocialPublisherPostClient(http);

    await client.publishLongVideoToWorkspace({
      workspaceId: "ws_1",
      video: "https://videos.example.com/ep14.mp4",
      youtube: { title: "t", description: "d", tags: [] },
    });

    expect(uploadedTo).toHaveLength(0);
    expect(http.calls[0].url).toBe("/api/social-publisher-post/long-video/workspace/by-url");
    expect(http.calls[0].body).toMatchObject({ source: "video-url", videoURL: "https://videos.example.com/ep14.mp4" });
  });

  it("reports upload progress", async () => {
    const http = makeHttp([UPLOAD_URLS, CREATED]);
    const client = new SocialPublisherPostClient(http);
    const seen: number[] = [];

    await client.publishLongVideoToWorkspace({
      workspaceId: "ws_1",
      video: videoFile(),
      youtube: { title: "t", description: "d", tags: [] },
      onProgress: (p) => seen.push(p),
    });

    expect(seen).toEqual([0, 100]);
  });

  it("surfaces partially refused targets rather than hiding them", async () => {
    const refused = { ...CREATED, refusedTargets: [{ platform: "instagram", reason: "Instagram accepts videos up to 15 minutes; this video is 40m." }] };
    const http = makeHttp([UPLOAD_URLS, refused]);
    const client = new SocialPublisherPostClient(http);

    const result = await client.publishLongVideoToWorkspace({ workspaceId: "ws_1", video: videoFile(), youtube: { title: "t", description: "d", tags: [] } });
    expect(result.refusedTargets).toHaveLength(1);
    expect(result.refusedTargets[0].platform).toBe("instagram");
  });

  it("defaults the duration fields when an older server omits them", async () => {
    const http = makeHttp([UPLOAD_URLS, { _id: "post_abc" }]);
    const client = new SocialPublisherPostClient(http);
    const result = await client.publishLongVideoToWorkspace({ workspaceId: "ws_1", video: videoFile(), youtube: { title: "t", description: "d", tags: [] } });
    expect(result).toEqual({ _id: "post_abc", durationSeconds: 0, creditUnits: 0, credits: 0, refusedTargets: [] });
  });

  describe("refuses bad input before touching the network", () => {
    it.each([
      [{ video: videoFile(), youtube: { title: "t", description: "d", tags: [] } }, "workspaceId is required"],
      [{ workspaceId: "ws_1", youtube: { title: "t", description: "d", tags: [] } }, "video is required"],
      [{ workspaceId: "ws_1", video: videoFile() }, "at least one platform configuration"],
    ])("%#", async (options, message) => {
      const http = makeHttp();
      const client = new SocialPublisherPostClient(http);
      await expect(client.publishLongVideoToWorkspace(options as any)).rejects.toThrow(message);
      expect(http.calls).toHaveLength(0);
    });

    it("rejects a container the platforms do not take", async () => {
      const http = makeHttp();
      const client = new SocialPublisherPostClient(http);
      await expect(
        client.publishLongVideoToWorkspace({ workspaceId: "ws_1", video: videoFile("clip.wmv", "video/x-ms-wmv"), youtube: { title: "t", description: "d", tags: [] } }),
      ).rejects.toThrow("Invalid video file type");
      expect(http.calls).toHaveLength(0);
    });

    it("rejects a file over the client's size ceiling before uploading", async () => {
      const http = makeHttp();
      const client = new SocialPublisherPostClient(http);
      const huge = videoFile("huge.mp4", "video/mp4", client.maxVideoUploadSizeBytes + 1);
      await expect(client.publishLongVideoToWorkspace({ workspaceId: "ws_1", video: huge, youtube: { title: "t", description: "d", tags: [] } })).rejects.toThrow(
        "exceeds maximum allowed size",
      );
      expect(http.calls).toHaveLength(0);
    });
  });
});

describe("publishLongVideoToAccount", () => {
  it("targets the account routes", async () => {
    const http = makeHttp([UPLOAD_URLS, CREATED]);
    const client = new SocialPublisherPostClient(http);

    await client.publishLongVideoToAccount({ accountId: "acc_1", video: videoFile(), youtube: { title: "t", description: "d", tags: [] } });

    expect(http.calls[1].url).toBe("/api/social-publisher-post/long-video/account/by-file/post_abc");
    expect(http.calls[1].body).toMatchObject({ accountId: "acc_1", source: "video-file" });
  });

  it("requires an accountId", async () => {
    const http = makeHttp();
    const client = new SocialPublisherPostClient(http);
    await expect(client.publishLongVideoToAccount({ video: videoFile(), youtube: { title: "t", description: "d", tags: [] } } as any)).rejects.toThrow(
      "accountId is required",
    );
  });
});

describe("scheduling", () => {
  it("sends a scheduled date in the wire shape", async () => {
    const when = new Date("2026-09-15T10:00:00Z");
    const http = makeHttp([CREATED]);
    const client = new SocialPublisherPostClient(http);

    await client.publishLongVideoToWorkspace({
      workspaceId: "ws_1",
      video: "https://videos.example.com/ep14.mp4",
      youtube: { title: "t", description: "d", tags: [] },
      schedule: when,
    });

    expect(http.calls[0].body.schedule).toEqual({ type: "schedule", scheduledAt: when });
  });

  it("omits schedule entirely when not given, letting the server default to now", async () => {
    const http = makeHttp([CREATED]);
    const client = new SocialPublisherPostClient(http);
    await client.publishLongVideoToWorkspace({ workspaceId: "ws_1", video: "https://videos.example.com/ep14.mp4", youtube: { title: "t", description: "d", tags: [] } });
    expect(http.calls[0].body.schedule).toBeUndefined();
  });
});

describe("reschedulePost", () => {
  it("PUTs the new time to the post", async () => {
    const when = new Date("2026-09-20T08:00:00Z");
    const http = makeHttp([{}]);
    const client = new SocialPublisherPostClient(http);

    await client.reschedulePost("post_abc", { schedule: when });

    expect(http.calls[0]).toEqual({
      method: "PUT",
      url: "/api/social-publisher-post/post_abc",
      body: { schedule: { type: "schedule", scheduledAt: when } },
    });
  });

  it("can flip a scheduled post to publish now", async () => {
    const http = makeHttp([{}]);
    const client = new SocialPublisherPostClient(http);
    await client.reschedulePost("post_abc", { schedule: "now" });
    expect(http.calls[0].body.schedule).toEqual({ type: "now", scheduledAt: undefined });
  });

  it("passes a replacement caption through only when given", async () => {
    const http = makeHttp([{}, {}]);
    const client = new SocialPublisherPostClient(http);

    await client.reschedulePost("post_abc", { schedule: "now", caption: "New caption" });
    expect(http.calls[0].body.caption).toBe("New caption");

    await client.reschedulePost("post_abc", { schedule: "now" });
    expect("caption" in http.calls[1].body).toBe(false);
  });

  it("requires an id", async () => {
    const http = makeHttp();
    const client = new SocialPublisherPostClient(http);
    await expect(client.reschedulePost("", { schedule: "now" })).rejects.toThrow("id is required");
    expect(http.calls).toHaveLength(0);
  });
});
