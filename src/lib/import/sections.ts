// spec.md §18: "Categories become tags by default. An optional mapping
// file assigns source categories to declared sections; unmapped posts go
// to the default section" — and the report always suggests a `sections`
// snippet regardless, since the helper decides, not the importer.

export interface SectionResolution {
  sectionId: string;
  /** Categories not consumed by the section mapping — these become tags instead. */
  remainingCategories: string[];
}

export function resolveSection(
  categories: string[],
  sectionMap: Record<string, string> | undefined,
  defaultSectionId: string,
): SectionResolution {
  if (sectionMap) {
    for (const category of categories) {
      const mapped = sectionMap[category];
      if (mapped) {
        return {
          sectionId: mapped,
          remainingCategories: categories.filter((c) => c !== category),
        };
      }
    }
  }
  return { sectionId: defaultSectionId, remainingCategories: categories };
}

/** A section id must be `[a-z0-9-]+` (site-config.schema.ts) — a category in a script
 * without a clean ASCII form gets a numbered placeholder; the label keeps the real name. */
function suggestId(category: string, index: number): string {
  const slug = category
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '') // strip to printable ASCII only — no attempted transliteration
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `section-${index + 1}`;
}

/** The report's "ready-to-paste sections snippet" (spec.md §18) — a suggestion, never applied automatically. */
export function suggestSectionsSnippet(allCategories: string[]): string {
  const unique = [...new Set(allCategories)];
  if (unique.length === 0) return '';
  const lines = unique.map(
    (category, index) => `  { id: '${suggestId(category, index)}', label: '${category}' },`,
  );
  return `sections: [\n${lines.join('\n')}\n],`;
}
