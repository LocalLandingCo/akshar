// No published types for this package. The only export the pipeline
// uses is `gfm`, a turndown plugin function (Service => void).
declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown';

  export function gfm(service: TurndownService): void;
}
