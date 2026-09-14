import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createImageDownloader, relativeImageRef } from './images';

describe('createImageDownloader', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'akshar-import-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it('downloads and writes the image bytes', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes, { status: 200 })),
    );

    const download = createImageDownloader();
    const result = await download('https://example.test/cover.jpg', dir, 'my-post-cover');

    expect(result.ok).toBe(true);
    expect(result.path).toMatch(/my-post-cover-[0-9a-f]+\.jpg$/);
    expect(new Uint8Array(readFileSync(result.path!))).toEqual(bytes);
  });

  it('deduplicates identical content across two different URLs/names', async () => {
    const bytes = new Uint8Array([5, 6, 7, 8]);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes, { status: 200 })),
    );

    const download = createImageDownloader();
    const first = await download('https://example.test/a.jpg', dir, 'post-a-cover');
    const second = await download('https://example.test/b.jpg', dir, 'post-b-cover');

    expect(second.path).toBe(first.path);
  });

  it('reports a non-OK HTTP status as a failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not found', { status: 404 })),
    );

    const download = createImageDownloader();
    const result = await download('https://example.test/missing.jpg', dir, 'cover');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('404');
  });

  it('reports a network error as a failure, not a thrown exception', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('getaddrinfo ENOTFOUND');
      }),
    );

    const download = createImageDownloader();
    const result = await download('https://example.test/unreachable.jpg', dir, 'cover');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('ENOTFOUND');
  });
});

describe('relativeImageRef', () => {
  it('produces a same-directory relative reference', () => {
    const ref = relativeImageRef(
      '/repo/content/posts/essays',
      '/repo/content/posts/essays/cover-abc.jpg',
    );
    expect(ref).toBe('./cover-abc.jpg');
  });

  it('produces a cross-directory relative reference for a deduplicated image', () => {
    const ref = relativeImageRef(
      '/repo/content/posts/poems',
      '/repo/content/posts/essays/shared-abc.jpg',
    );
    expect(ref).toBe('../essays/shared-abc.jpg');
  });
});
