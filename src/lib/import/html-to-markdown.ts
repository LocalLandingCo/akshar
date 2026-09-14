import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ImageDownloadResult } from './images';
import { relativeImageRef } from './images';
import type { ReportedDrop, ReportedImage } from './types';

// spec.md §18/§5: raw HTML never survives import — everything becomes
// CommonMark + GFM. Dangerous or unrepresentable constructs are stripped
// and reported by name, never silently dropped; an iframe/object/embed
// becomes a plain link to what it pointed at, not nothing. WordPress's
// [gallery]/[caption]/[embed] *shortcodes* are text, not HTML — that's the
// WordPress adapter's job (Phase I-2), not this shared module's.

const DROPPED_TAGS: Record<string, string> = {
  script: 'a <script> tag',
  style: 'a <style> tag',
  form: 'a <form>',
  noscript: 'a <noscript> block',
  applet: 'an <applet> element',
  link: 'a <link> tag',
  meta: 'a <meta> tag',
};

const EMBED_TAGS = ['iframe', 'object', 'embed'];

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
turndownService.use(gfm);

function isTrackingPixel(el: { attribs?: Record<string, string> }): boolean {
  const w = el.attribs?.width;
  const h = el.attribs?.height;
  return (w === '1' && h === '1') || (w === '0' && h === '0');
}

function stripDangerousAttributes($: cheerio.CheerioAPI): void {
  $('*').each((_, el) => {
    if (!('attribs' in el)) return;
    const attribs = (el as { attribs?: Record<string, string> }).attribs ?? {};
    for (const name of Object.keys(attribs)) {
      if (name === 'style' || name.toLowerCase().startsWith('on')) {
        $(el).removeAttr(name);
      }
    }
  });
}

export interface CleanAndConvertOptions {
  postTitle: string;
  /** Where this post's own file will live — in-body images are downloaded alongside it. */
  postDir: string;
  downloadImage: (
    url: string,
    targetDir: string,
    preferredBaseName: string,
  ) => Promise<ImageDownloadResult>;
  /** A short, filesystem-safe stem for naming downloaded in-body images (usually the post's slug). */
  imageBaseName: string;
}

export interface CleanAndConvertResult {
  markdown: string;
  drops: ReportedDrop[];
  imagesNeedingAttention: ReportedImage[];
}

export async function cleanAndConvert(
  html: string,
  options: CleanAndConvertOptions,
): Promise<CleanAndConvertResult> {
  const $ = cheerio.load(html, { xmlMode: false });
  const drops: ReportedDrop[] = [];
  const imagesNeedingAttention: ReportedImage[] = [];

  for (const [tag, label] of Object.entries(DROPPED_TAGS)) {
    $(tag).each(() => {
      drops.push({ postTitle: options.postTitle, construct: label });
    });
    $(tag).remove();
  }

  for (const tag of EMBED_TAGS) {
    $(tag).each((_, el) => {
      const $el = $(el);
      const src = $el.attr('src') ?? $el.attr('data') ?? '';
      drops.push({ postTitle: options.postTitle, construct: `an <${tag}> embed` });
      if (src) {
        $el.replaceWith(`<p><a href="${src}">${src}</a></p>`);
      } else {
        $el.remove();
      }
    });
  }

  const trackingPixels = $('img').filter((_, el) => isTrackingPixel(el));
  trackingPixels.each(() => {
    drops.push({ postTitle: options.postTitle, construct: 'a tracking pixel' });
  });
  trackingPixels.remove();

  // Remote images: download into this post's own directory, rewrite the
  // src to the local, relative copy. A failed download falls back to the
  // image's alt text (spec.md §4 — a missing image must never reach the
  // build; the importer resolves that at import time, not build time).
  const imgs = $('img').toArray();
  let imageIndex = 0;
  for (const el of imgs) {
    const $el = $(el);
    const src = $el.attr('src');
    if (!src) {
      $el.remove();
      continue;
    }
    imageIndex += 1;
    const baseName =
      imageIndex === 1 ? options.imageBaseName : `${options.imageBaseName}-${imageIndex}`;
    const result = await options.downloadImage(src, options.postDir, baseName);
    if (result.ok && result.path) {
      $el.attr('src', relativeImageRef(options.postDir, result.path));
    } else {
      imagesNeedingAttention.push({
        postTitle: options.postTitle,
        url: src,
        reason: 'download-failed',
      });
      const alt = $el.attr('alt');
      if (alt) {
        $el.replaceWith(alt);
      } else {
        $el.remove();
      }
    }
  }

  stripDangerousAttributes($);

  const cleanedHtml = $.root().html() ?? '';
  const markdown = turndownService.turndown(cleanedHtml).trim();

  return { markdown, drops, imagesNeedingAttention };
}
