// Lighthouse CI (ADR-11, layer 3) — makes the ≥95 budgets in spec.md §11
// real rather than aspirational, and doubles as the enforcement mechanism
// for the theme contract's performance/accessibility promise.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/index.html',
        'http://localhost/essays/on-owning-your-words/index.html',
        'http://localhost/essays/index.html',
        'http://localhost/archive/index.html',
        // Deliberately NOT /search/ or /404.html: both are noindex on purpose
        // (spec.md §17 — search has no unique indexable content of its own;
        // a 404 obviously shouldn't be indexed). Lighthouse's SEO category
        // scores noindex itself as a failure regardless of intent, so
        // including either page here would be testing the wrong thing.
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
