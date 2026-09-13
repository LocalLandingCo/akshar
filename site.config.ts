import { defineSiteConfig } from './src/lib/site-config.schema';

// This is the file a writer (or their helper) fills in — see spec.md §8.
// Nothing here requires touching core code. The values below describe the
// example/demo site this repository ships with; replace them with a real
// writer's own identity, sections, and theme choice.

export default defineSiteConfig({
  url: 'https://example.akshar.dev',
  title: 'An Akshar Site',
  tagline: 'Notes from a writer who owns their words',
  description: 'An example publication built with Akshar — an open-source, self-owned blog engine.',
  language: 'en',
  dir: 'ltr',

  author: {
    name: 'The Writer',
    bio: 'Writes essays, poems, and notes. This bio comes from site.config.ts.',
    links: [{ label: 'Email', url: 'mailto:writer@example.com' }],
  },

  sections: [
    { id: 'essays', label: 'Essays', description: 'Long-form writing.' },
    { id: 'poems', label: 'Poems', description: 'Short-form writing.' },
  ],

  theme: {
    name: 'default',
    preset: 'default',
  },

  features: {
    search: true,
    archive: true,
    rss: true,
    rssFullContent: false,
    readingTime: true,
  },
});
