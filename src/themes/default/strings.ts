import type { UIStrings } from '../../lib/theme/contract';

// The default theme's English strings. A non-English site overrides this
// whole table — see spec.md §7, ADR-6: UI strings are theme contract data,
// never hardcoded in a layout.
const strings: UIStrings = {
  common: {
    noPostsYet: 'Nothing published yet.',
  },
  nav: {
    homeLabel: 'Home',
    archiveLabel: 'Archive',
    searchLabel: 'Search',
    skipToContent: 'Skip to content',
  },
  post: {
    publishedOn: (date) => `Published ${date}`,
    readingTime: (minutes) => `${minutes} min read`,
    tagsLabel: 'Tags',
  },
  section: {
    description: (label) => `Writing in ${label}`,
  },
  archive: {
    title: 'Archive',
  },
  tag: {
    title: (tag) => `Posts tagged “${tag}”`,
  },
  search: {
    title: 'Search',
    inputLabel: 'Search posts',
    placeholder: 'Search…',
    noJsMessage: 'Search needs JavaScript enabled. Browse by tag or the archive instead.',
    noResults: 'No results. Try a different word, or browse by tag or the archive.',
    prompt: 'Type to search titles, excerpts, and tags.',
    browseHeading: 'Browse',
  },
  notFound: {
    title: 'Page not found',
    message: "The page you're looking for doesn't exist or may have moved.",
    backHome: 'Back to home',
  },
  footer: {
    rssLabel: 'RSS',
    builtWith: 'Built with Akshar',
  },
};

export default strings;
