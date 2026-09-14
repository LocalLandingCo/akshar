import { describe, expect, it, vi } from 'vitest';
import { cleanAndConvert } from './html-to-markdown';

function stubDownloader(behavior: 'succeed' | 'fail' = 'succeed') {
  return vi.fn(async (_url: string, _dir: string, baseName: string) =>
    behavior === 'succeed'
      ? { ok: true, path: `/fake/content/posts/essays/${baseName}-abc123.jpg` }
      : { ok: false, error: 'HTTP 404' },
  );
}

const baseOptions = (downloadImage: ReturnType<typeof stubDownloader>) => ({
  postTitle: 'Test Post',
  postDir: '/fake/content/posts/essays',
  imageBaseName: 'test-post',
  downloadImage,
});

describe('cleanAndConvert', () => {
  it('converts plain HTML to Markdown', async () => {
    const { markdown } = await cleanAndConvert(
      '<p>Hello <strong>world</strong>.</p>',
      baseOptions(stubDownloader()),
    );
    expect(markdown).toBe('Hello **world**.');
  });

  it('strips a <script> tag and reports it', async () => {
    const { markdown, drops } = await cleanAndConvert(
      "<p>Text.</p><script>alert('x')</script>",
      baseOptions(stubDownloader()),
    );
    expect(markdown).not.toContain('alert');
    expect(markdown).not.toContain('<script>');
    expect(drops).toContainEqual({ postTitle: 'Test Post', construct: 'a <script> tag' });
  });

  it('replaces an <iframe> embed with a plain link to its src', async () => {
    const { markdown, drops } = await cleanAndConvert(
      '<iframe src="https://www.youtube.com/embed/abc123"></iframe>',
      baseOptions(stubDownloader()),
    );
    expect(markdown).toContain('https://www.youtube.com/embed/abc123');
    expect(drops).toContainEqual({ postTitle: 'Test Post', construct: 'an <iframe> embed' });
  });

  it('strips a 1x1 tracking pixel and reports it, without touching a real image', async () => {
    const html =
      '<img src="https://tracker.example/pixel.gif" width="1" height="1" alt="" />' +
      '<img src="https://example.test/photo.jpg" width="800" height="600" alt="A photo" />';
    const downloadImage = stubDownloader();
    const { markdown, drops } = await cleanAndConvert(html, baseOptions(downloadImage));
    expect(drops).toContainEqual({ postTitle: 'Test Post', construct: 'a tracking pixel' });
    expect(downloadImage).toHaveBeenCalledTimes(1); // only the real photo
    expect(markdown).toContain('A photo');
  });

  it('strips inline style and on* attributes everywhere', async () => {
    const { markdown } = await cleanAndConvert(
      '<p style="color:red" onclick="doBad()">Text</p>',
      baseOptions(stubDownloader()),
    );
    expect(markdown).not.toContain('onclick');
    expect(markdown).not.toContain('color:red');
    expect(markdown).toBe('Text');
  });

  it('downloads a real image and rewrites its src to the local relative path', async () => {
    const downloadImage = stubDownloader();
    const { markdown } = await cleanAndConvert(
      '<img src="https://example.test/cover.jpg" alt="A cover" />',
      baseOptions(downloadImage),
    );
    expect(downloadImage).toHaveBeenCalledWith(
      'https://example.test/cover.jpg',
      '/fake/content/posts/essays',
      'test-post',
    );
    expect(markdown).toContain('./test-post-abc123.jpg');
    expect(markdown).not.toContain('example.test');
  });

  it('falls back to alt text and reports the failure when a download fails', async () => {
    const { markdown, imagesNeedingAttention } = await cleanAndConvert(
      '<img src="https://example.test/missing.jpg" alt="A missing photo" />',
      baseOptions(stubDownloader('fail')),
    );
    expect(markdown).toContain('A missing photo');
    expect(markdown).not.toContain('example.test');
    expect(imagesNeedingAttention).toEqual([
      {
        postTitle: 'Test Post',
        url: 'https://example.test/missing.jpg',
        reason: 'download-failed',
      },
    ]);
  });

  it('names a second in-body image distinctly from the first', async () => {
    const downloadImage = stubDownloader();
    await cleanAndConvert(
      '<img src="https://example.test/a.jpg" alt="A" /><img src="https://example.test/b.jpg" alt="B" />',
      baseOptions(downloadImage),
    );
    expect(downloadImage).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.any(String),
      'test-post',
    );
    expect(downloadImage).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(String),
      'test-post-2',
    );
  });

  it('preserves Devanagari text through conversion untouched', async () => {
    const { markdown } = await cleanAndConvert(
      '<p>आभाळ आज जड झालं,<br />शब्दांआधी पाऊस आला.</p>',
      baseOptions(stubDownloader()),
    );
    expect(markdown).toContain('आभाळ आज जड झालं');
    expect(markdown).toContain('शब्दांआधी पाऊस आला');
  });
});
