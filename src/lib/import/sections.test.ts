import { describe, expect, it } from 'vitest';
import { resolveSection, suggestSectionsSnippet } from './sections';

describe('resolveSection', () => {
  it('maps a category to its declared section, and drops it from the remaining categories', () => {
    const result = resolveSection(['Essays', 'ownership'], { Essays: 'essays' }, 'posts');
    expect(result).toEqual({ sectionId: 'essays', remainingCategories: ['ownership'] });
  });

  it('falls back to the default section when no category maps', () => {
    const result = resolveSection(['Ramblings'], { Essays: 'essays' }, 'posts');
    expect(result).toEqual({ sectionId: 'posts', remainingCategories: ['Ramblings'] });
  });

  it('falls back to the default section with no map at all, keeping every category as a tag', () => {
    const result = resolveSection(['Essays', 'Poems'], undefined, 'posts');
    expect(result).toEqual({ sectionId: 'posts', remainingCategories: ['Essays', 'Poems'] });
  });

  it('uses the first matching category when more than one maps', () => {
    const result = resolveSection(
      ['Poems', 'Essays'],
      { Essays: 'essays', Poems: 'poems' },
      'posts',
    );
    expect(result.sectionId).toBe('poems');
  });
});

describe('suggestSectionsSnippet', () => {
  it('produces one entry per distinct category', () => {
    const snippet = suggestSectionsSnippet(['Essays', 'Poems', 'Essays']);
    expect(snippet).toContain("{ id: 'essays', label: 'Essays' }");
    expect(snippet).toContain("{ id: 'poems', label: 'Poems' }");
    expect(snippet.match(/{ id:/g)).toHaveLength(2);
  });

  it('falls back to a numbered id for a category with no ASCII form', () => {
    const snippet = suggestSectionsSnippet(['मराठी']);
    expect(snippet).toContain("{ id: 'section-1', label: 'मराठी' }");
  });

  it('returns an empty string for no categories', () => {
    expect(suggestSectionsSnippet([])).toBe('');
  });
});
