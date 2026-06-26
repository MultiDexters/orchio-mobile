/**
 * Markdown → clean speech text.
 *
 * The voice agent must NEVER read raw markdown aloud ("asterisk asterisk
 * bold"). This is used both before TTS and before showing the "Listen"
 * playback on the Chat screen. Keep it conservative: strip formatting,
 * preserve the words and sentence flow.
 */

/** Remove a fenced ```json ... ``` (or any fenced code) block used for
 *  machine-readable extraction so it is never spoken or displayed. */
export function stripFencedBlocks(input: string): string {
  return input
    // ```lang\n ... \n```
    .replace(/```[\s\S]*?```/g, ' ')
    // a bare {"parsed_items": ...} object that leaked without a fence
    .replace(/\{\s*"parsed_items"[\s\S]*\}\s*$/m, ' ');
}

const REPLACEMENTS: [RegExp, string][] = [
  // images ![alt](url) -> alt
  [/!\[([^\]]*)\]\([^)]*\)/g, '$1'],
  // links [text](url) -> text
  [/\[([^\]]+)\]\([^)]*\)/g, '$1'],
  // bold/italic ***x*** **x** *x* ___x___ __x__ _x_
  [/(\*\*\*|\*\*|\*|___|__|_)(.*?)\1/g, '$2'],
  // inline `code`
  [/`([^`]*)`/g, '$1'],
  // headings: leading #'s
  [/^#{1,6}\s+/gm, ''],
  // blockquotes
  [/^\s{0,3}>\s?/gm, ''],
  // unordered list markers - * +
  [/^\s*[-*+]\s+/gm, ''],
  // ordered list markers 1. 2)
  [/^\s*\d+[.)]\s+/gm, ''],
  // horizontal rules
  [/^\s*([-*_])\1{2,}\s*$/gm, ''],
  // table pipes / separators
  [/\|/g, ' '],
  [/^\s*:?-{2,}:?\s*$/gm, ''],
  // strikethrough ~~x~~
  [/~~(.*?)~~/g, '$1'],
];

export function stripMarkdown(input: string | null | undefined): string {
  if (!input) return '';
  let text = stripFencedBlocks(input);

  for (const [pattern, replacement] of REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  text = text
    // any stray formatting characters that survived
    .replace(/[*_#>~|]/g, '')
    // collapse the awkward whitespace those removals leave behind
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return text;
}

/**
 * Prepare text specifically for TTS: strip markdown, then flatten into
 * speakable sentences (no double newlines, normalised punctuation).
 */
export function toSpeech(input: string | null | undefined): string {
  const clean = stripMarkdown(input);
  return clean
    .replace(/\n+/g, '. ')
    .replace(/\.\s*\.\s*/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
