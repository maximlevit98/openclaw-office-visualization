/**
 * Simple markdown-like text formatter
 * Handles bold, italic, code blocks, and code inline
 */

export interface FormattedText {
  type: "text" | "bold" | "italic" | "code" | "codeblock" | "list";
  content: string;
}

/**
 * Parse text and return formatted segments
 * Supports:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `code` for inline code
 * - ``` code ``` for code blocks
 * - - item for lists
 */
export function parseMarkdown(text: string): FormattedText[] {
  const segments: FormattedText[] = [];
  let remaining = text;
  let pos = 0;

  while (remaining.length > 0) {
    // Code block (triple backticks)
    const codeBlockMatch = remaining.match(/^```([\s\S]*?)```/);
    if (codeBlockMatch) {
      if (pos > 0) segments.push({ type: "text", content: remaining.substring(0, pos) });
      segments.push({ type: "codeblock", content: codeBlockMatch[1].trim() });
      remaining = remaining.substring(codeBlockMatch[0].length);
      continue;
    }

    // Bold **text**
    const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
    if (boldMatch) {
      segments.push({ type: "bold", content: boldMatch[1] });
      remaining = remaining.substring(boldMatch[0].length);
      continue;
    }

    // Italic *text*
    const italicMatch = remaining.match(/^\*(.*?)\*/);
    if (italicMatch) {
      segments.push({ type: "italic", content: italicMatch[1] });
      remaining = remaining.substring(italicMatch[0].length);
      continue;
    }

    // Inline code `text`
    const codeMatch = remaining.match(/^`(.*?)`/);
    if (codeMatch) {
      segments.push({ type: "code", content: codeMatch[1] });
      remaining = remaining.substring(codeMatch[0].length);
      continue;
    }

    // List item - item
    const listMatch = remaining.match(/^- (.*?)(?:\n|$)/);
    if (listMatch) {
      segments.push({ type: "list", content: listMatch[1] });
      remaining = remaining.substring(listMatch[0].length);
      continue;
    }

    // Plain text until next formatting
    const nextFormattingIndex = remaining.search(/[\*`\-]/);
    if (nextFormattingIndex === -1) {
      segments.push({ type: "text", content: remaining });
      break;
    }

    segments.push({ type: "text", content: remaining.substring(0, nextFormattingIndex) });
    remaining = remaining.substring(nextFormattingIndex);
  }

  return segments.filter((s) => s.content.length > 0);
}

/**
 * Detect if text contains code blocks
 */
export function hasCodeBlock(text: string): boolean {
  return /```/.test(text);
}

/**
 * Extract language hint from code block (e.g., ```javascript → javascript)
 */
export function extractCodeLanguage(text: string): string | null {
  const match = text.match(/^```(\w+)/);
  return match ? match[1] : null;
}
