import { describe, expect, it } from 'vitest';
import { normalizeSlug, resolveSlugCollision } from './slug';

describe('normalizeSlug', () => {
  it('percent-decodes a URL-encoded slug', () => {
    expect(normalizeSlug('%e0%a4%aa%e0%a4%be%e0%a4%8a%e0%a4%b8')).toBe('पाऊस');
  });

  it('leaves an already-decoded slug unchanged (besides normalization)', () => {
    expect(normalizeSlug('on-owning-your-words')).toBe('on-owning-your-words');
  });

  it('NFC-normalizes a decomposed Unicode slug', () => {
    const decomposed = 'entry-े'.normalize('NFD');
    expect(normalizeSlug(decomposed)).toBe('entry-े'.normalize('NFC'));
  });

  it('never throws or empties out on malformed percent-encoding', () => {
    expect(normalizeSlug('50%-off')).toBe('50%-off');
  });
});

describe('resolveSlugCollision', () => {
  it('returns the slug unchanged when not taken', () => {
    expect(resolveSlugCollision('my-post', new Set())).toBe('my-post');
  });

  it('appends -2 on a first collision', () => {
    expect(resolveSlugCollision('my-post', new Set(['my-post']))).toBe('my-post-2');
  });

  it('finds the next free number across multiple collisions', () => {
    const taken = new Set(['my-post', 'my-post-2', 'my-post-3']);
    expect(resolveSlugCollision('my-post', taken)).toBe('my-post-4');
  });
});
