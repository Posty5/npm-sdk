/**
 * tus client — protocol-level tests against a mocked transport.
 *
 * These assert the wire behaviour the server actually requires: the creation
 * POST's headers, base64 metadata, the PATCH loop, offset re-sync on conflict,
 * resume, and abort.
 */
import { supportsResumableUpload, uploadResumable, terminateUpload, DEFAULT_CHUNK_SIZE } from '@posty5/social-publisher-post';

type Req = { url: string; method: string; headers: Record<string, string>; bodySize: number };

const TARGET = {
  fileURL: 'https://cdn.example.com/v.mp4',
  uploadFileURL: 'https://upload.example.com/v?sig=x',
  bucketFilePath: 'k/v.mp4',
  tusEndpoint: 'https://api.example.com/api/uploads/tus',
  ticket: 'payload.signature',
  maxSize: 1024 * 1024 * 1024,
};

const UPLOAD_URL = 'https://api.example.com/api/uploads/tus/abc-123';

/** A Blob whose size we control without allocating the bytes. */
function fakeFile(size: number, name = 'recording.mp4', type = 'video/mp4') {
  const file = new File([new Blob(['x'])], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  // slice() must report the sliced length, since the client derives progress
  // from what it sends.
  (file as any).slice = (start: number, end: number) => {
    const part = new Blob(['x']);
    Object.defineProperty(part, 'size', { value: end - start });
    return part;
  };
  return file;
}

/**
 * Drives a scripted tus server. `patchResponses` lets a test inject a conflict
 * or a failure at a given chunk index.
 */
function mockServer(opts: { size: number; startOffset?: number; patch?: (i: number, offset: number) => any } = { size: 0 }) {
  const requests: Req[] = [];
  let served = opts.startOffset ?? 0;
  let patchIndex = 0;

  const headersOf = (init: any): Record<string, string> => ({ ...(init?.headers || {}) });

  (globalThis as any).fetch = jest.fn(async (url: string, init: any) => {
    const headers = headersOf(init);
    requests.push({
      url: String(url),
      method: init.method,
      headers,
      bodySize: init.body?.size ?? 0,
    });

    // Termination carries no signal on purpose — it runs *because* the
    // transfer's signal aborted, and a fetch with an aborted signal never
    // leaves. So it is answered before the abort guard below.
    if (init.method === 'DELETE') {
      return { status: 204, ok: true, headers: new Map() as any, text: async () => '' };
    }

    if (init.signal?.aborted) {
      const err: any = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }

    if (init.method === 'POST') {
      return {
        status: 201,
        ok: true,
        headers: new Map([['Location', UPLOAD_URL]]) as any,
        text: async () => '',
      };
    }

    if (init.method === 'HEAD') {
      return { status: 200, ok: true, headers: new Map([['Upload-Offset', String(served)]]) as any, text: async () => '' };
    }

    // PATCH
    const override = opts.patch?.(patchIndex++, served);
    if (override) {
      if (override.status === 409) {
        return { status: 409, ok: false, headers: new Map() as any, text: async () => 'conflict' };
      }
      return { status: override.status, ok: false, headers: new Map() as any, text: async () => override.body ?? '' };
    }

    served = Math.min(served + (init.body?.size ?? 0), opts.size);
    return { status: 204, ok: true, headers: new Map([['Upload-Offset', String(served)]]) as any, text: async () => '' };
  });

  // `headers.get` on a Map needs the same shape fetch gives us.
  const map = Map.prototype as any;
  if (!map.get_orig) {
    map.get_orig = map.get;
  }

  return { requests, servedOffset: () => served };
}

afterEach(() => {
  delete (globalThis as any).fetch;
});

describe('supportsResumableUpload', () => {
  it('is true only when the server offered both the endpoint and a ticket', () => {
    expect(supportsResumableUpload(TARGET)).toBe(true);
    expect(supportsResumableUpload({ ...TARGET, ticket: undefined })).toBe(false);
    expect(supportsResumableUpload({ ...TARGET, tusEndpoint: undefined })).toBe(false);
  });
});

describe('creation', () => {
  it('sends the tus version, the length and the ticket as base64 metadata', async () => {
    const size = 100;
    const { requests } = mockServer({ size });

    await uploadResumable(TARGET, fakeFile(size), { chunkSize: size });

    const create = requests[0];
    expect(create.method).toBe('POST');
    expect(create.url).toBe(TARGET.tusEndpoint);
    expect(create.headers['Tus-Resumable']).toBe('1.0.0');
    expect(create.headers['Upload-Length']).toBe('100');

    // tus metadata is `key base64value` pairs, comma separated.
    const meta = create.headers['Upload-Metadata'];
    const ticketPair = meta.split(',').find((p) => p.startsWith('ticket '))!;
    expect(Buffer.from(ticketPair.split(' ')[1], 'base64').toString('utf8')).toBe(TARGET.ticket);

    const namePair = meta.split(',').find((p) => p.startsWith('filename '))!;
    expect(Buffer.from(namePair.split(' ')[1], 'base64').toString('utf8')).toBe('recording.mp4');
  });

  it('hands the caller the upload URL so the transfer can be resumed later', async () => {
    const size = 10;
    mockServer({ size });
    const seen: string[] = [];

    await uploadResumable(TARGET, fakeFile(size), { chunkSize: size, onUploadUrl: (u) => seen.push(u) });

    expect(seen).toEqual([UPLOAD_URL]);
  });

  it('refuses a file over the target size before contacting the server', async () => {
    const { requests } = mockServer({ size: 10 });
    await expect(
      uploadResumable({ ...TARGET, maxSize: 5 }, fakeFile(10)),
    ).rejects.toThrow('larger than');
    expect(requests).toHaveLength(0);
  });

  it('refuses a target with no resumable support', async () => {
    mockServer({ size: 10 });
    await expect(uploadResumable({ ...TARGET, ticket: undefined }, fakeFile(10))).rejects.toThrow(
      'does not support resumable',
    );
  });
});

describe('the PATCH loop', () => {
  it('sends the file in chunks at the right offsets', async () => {
    const size = 25;
    const { requests } = mockServer({ size });

    await uploadResumable(TARGET, fakeFile(size), { chunkSize: 10 });

    const patches = requests.filter((r) => r.method === 'PATCH');
    expect(patches.map((p) => p.headers['Upload-Offset'])).toEqual(['0', '10', '20']);
    expect(patches.map((p) => p.bodySize)).toEqual([10, 10, 5]);
    for (const p of patches) {
      expect(p.headers['Content-Type']).toBe('application/offset+octet-stream');
      expect(p.headers['Tus-Resumable']).toBe('1.0.0');
      expect(p.url).toBe(UPLOAD_URL);
    }
  });

  it('defaults to the server’s 8MiB part size', () => {
    expect(DEFAULT_CHUNK_SIZE).toBe(8 * 1024 * 1024);
  });

  it('reports progress and finishes at 100', async () => {
    const size = 20;
    mockServer({ size });
    const progress: number[] = [];

    await uploadResumable(TARGET, fakeFile(size), { chunkSize: 10, onProgress: (p) => progress.push(p) });

    expect(progress[0]).toBe(0);
    expect(progress[progress.length - 1]).toBe(100);
    expect(progress).toContain(50);
  });

  it('resolves with the URL the file will be served from', async () => {
    mockServer({ size: 10 });
    await expect(uploadResumable(TARGET, fakeFile(10), { chunkSize: 10 })).resolves.toBe(TARGET.fileURL);
  });

  it('re-syncs from the server when the offset conflicts, instead of retrying blindly', async () => {
    const size = 20;
    // Fail the first PATCH with 409; the client must HEAD to learn the truth.
    const { requests } = mockServer({ size, patch: (i) => (i === 0 ? { status: 409 } : undefined) });

    await uploadResumable(TARGET, fakeFile(size), { chunkSize: 10 });

    expect(requests.filter((r) => r.method === 'HEAD').length).toBeGreaterThanOrEqual(1);
  });

  it('does not retry a 4xx rejection — an expired ticket will never succeed', async () => {
    const { requests } = mockServer({ size: 10, patch: () => ({ status: 403, body: 'Invalid upload ticket.' }) });

    await expect(uploadResumable(TARGET, fakeFile(10), { chunkSize: 10 })).rejects.toThrow('Upload rejected (403)');

    // One attempt, not the full retry ladder.
    expect(requests.filter((r) => r.method === 'PATCH')).toHaveLength(1);
  });
});

describe('resuming', () => {
  it('asks the server for the offset and only sends what is missing', async () => {
    const size = 30;
    const { requests } = mockServer({ size, startOffset: 20 });

    await uploadResumable(TARGET, fakeFile(size), { chunkSize: 10, uploadUrl: UPLOAD_URL });

    // No creation POST — we joined an existing upload.
    expect(requests.filter((r) => r.method === 'POST')).toHaveLength(0);
    expect(requests[0].method).toBe('HEAD');

    const patches = requests.filter((r) => r.method === 'PATCH');
    expect(patches).toHaveLength(1);
    expect(patches[0].headers['Upload-Offset']).toBe('20');
  });

  it('starts progress from what the server already holds', async () => {
    const size = 100;
    mockServer({ size, startOffset: 40 });
    const progress: number[] = [];

    await uploadResumable(TARGET, fakeFile(size), { chunkSize: 60, uploadUrl: UPLOAD_URL, onProgress: (p) => progress.push(p) });

    expect(progress[0]).toBe(40);
  });
});

describe('aborting', () => {
  it('stops before contacting the server when already aborted', async () => {
    const { requests } = mockServer({ size: 10 });
    const controller = new AbortController();
    controller.abort();

    await expect(uploadResumable(TARGET, fakeFile(10), { signal: controller.signal })).rejects.toThrow('Upload aborted');
    expect(requests).toHaveLength(0);
  });

  it('leaves the partial upload on the server by default', async () => {
    const size = 30;
    const controller = new AbortController();
    const { requests } = mockServer({
      size,
      patch: (i) => {
        // Abort midway: the first chunk lands, the second finds the signal set.
        if (i === 1) controller.abort();
        return undefined;
      },
    });

    await expect(
      uploadResumable(TARGET, fakeFile(size), { chunkSize: 10, signal: controller.signal }),
    ).rejects.toThrow('Upload aborted');

    // Pause and cancel are the same gesture in most UIs, so the bytes stay put
    // and the transfer can be resumed by its upload URL.
    expect(requests.filter((r) => r.method === 'DELETE')).toHaveLength(0);
  });

  it('discards the partial upload when the caller asks it to', async () => {
    const size = 30;
    const controller = new AbortController();
    const { requests } = mockServer({
      size,
      patch: (i) => {
        if (i === 1) controller.abort();
        return undefined;
      },
    });

    await expect(
      uploadResumable(TARGET, fakeFile(size), {
        chunkSize: 10,
        signal: controller.signal,
        terminateOnAbort: true,
      }),
    ).rejects.toThrow('Upload aborted');

    const deletes = requests.filter((r) => r.method === 'DELETE');
    expect(deletes).toHaveLength(1);
    expect(deletes[0].url).toBe(UPLOAD_URL);
    expect(deletes[0].headers['Tus-Resumable']).toBe('1.0.0');
  });
});

describe('terminateUpload', () => {
  it('reports success when the server confirms', async () => {
    mockServer({ size: 0 });
    await expect(terminateUpload(UPLOAD_URL)).resolves.toBe(true);
  });

  it('treats an already-gone upload as terminated', async () => {
    (globalThis as any).fetch = jest.fn(async () => ({ status: 410, ok: false, headers: new Map() as any, text: async () => '' }));
    await expect(terminateUpload(UPLOAD_URL)).resolves.toBe(true);
  });

  it('never throws — a failed cleanup of something that expires anyway is not an error', async () => {
    (globalThis as any).fetch = jest.fn(async () => {
      throw new Error('network down');
    });
    await expect(terminateUpload(UPLOAD_URL)).resolves.toBe(false);
  });
});
