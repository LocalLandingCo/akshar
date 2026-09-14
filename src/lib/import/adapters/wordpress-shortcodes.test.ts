import { describe, expect, it } from 'vitest';
import type { ReportedDrop } from '../types';
import { resolveShortcodes, stripBlockEditorComments, type Attachment } from './wordpress';

describe('stripBlockEditorComments', () => {
  it('removes wp: block comments without touching real content', () => {
    const html = '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
    expect(stripBlockEditorComments(html)).toBe('<p>Hello</p>');
  });

  it('removes a block comment carrying JSON attributes', () => {
    const html =
      '<!-- wp:image {"id":123,"sizeSlug":"large"} --><figure></figure><!-- /wp:image -->';
    expect(stripBlockEditorComments(html)).toBe('<figure></figure>');
  });

  it('leaves an ordinary HTML comment alone', () => {
    const html = '<!-- a normal comment --><p>Text</p>';
    expect(stripBlockEditorComments(html)).toBe(html);
  });
});

describe('resolveShortcodes', () => {
  const attachments = new Map<string, Attachment>([
    ['1', { url: 'https://example.test/photo-1.jpg', alt: 'Photo one' }],
    ['2', { url: 'https://example.test/photo-2.jpg' }],
  ]);

  it('converts [embed]URL[/embed] to a plain link', () => {
    const html = 'Before [embed]https://example.test/video[/embed] After';
    const drops: ReportedDrop[] = [];
    const result = resolveShortcodes(html, attachments, 'Test Post', drops);
    expect(result).toContain('<a href="https://example.test/video">https://example.test/video</a>');
    expect(drops).toEqual([]);
  });

  it('extracts the image and caption text from [caption]', () => {
    const html =
      '[caption id="attachment_1" align="alignnone" width="300"]<img src="a.jpg" /> A lovely photo[/caption]';
    const drops: ReportedDrop[] = [];
    const result = resolveShortcodes(html, attachments, 'Test Post', drops);
    expect(result).toContain('<img src="a.jpg" />');
    expect(result).toContain('<em>A lovely photo</em>');
  });

  it('expands [gallery ids="1,2"] into resolved <img> tags', () => {
    const html = '[gallery ids="1,2"]';
    const drops: ReportedDrop[] = [];
    const result = resolveShortcodes(html, attachments, 'Test Post', drops);
    expect(result).toContain('src="https://example.test/photo-1.jpg"');
    expect(result).toContain('alt="Photo one"');
    expect(result).toContain('src="https://example.test/photo-2.jpg"');
    expect(drops).toEqual([]);
  });

  it('reports (and skips) a gallery image id that has no matching attachment', () => {
    const html = '[gallery ids="1,999"]';
    const drops: ReportedDrop[] = [];
    const result = resolveShortcodes(html, attachments, 'Test Post', drops);
    expect(result).toContain('photo-1.jpg');
    expect(result).not.toContain('999');
    expect(drops).toEqual([
      {
        postTitle: 'Test Post',
        construct: 'a [gallery] image (attachment id 999) that could not be resolved',
      },
    ]);
  });
});
