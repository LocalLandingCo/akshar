// Extracts `--custom-property: value;` declarations from a theme's
// tokens.css, separately for the light (`:root`) and dark
// (`@media (prefers-color-scheme: dark)`) blocks — just enough parsing to
// let a test check contrast without hand-duplicating the palette.

export interface ParsedTokens {
  light: Record<string, string>;
  dark: Record<string, string>;
}

function extractDeclarations(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const pattern = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(block))) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

export function parseTokensCss(css: string): ParsedTokens {
  const darkMatch = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{([\s\S]*)\}\s*$/);
  const darkBlock = darkMatch ? darkMatch[1] : '';
  const lightBlock = darkMatch ? css.slice(0, darkMatch.index) : css;
  return {
    light: extractDeclarations(lightBlock),
    dark: extractDeclarations(darkBlock),
  };
}
