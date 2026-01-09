import DOMPurify from "dompurify";
import { remark } from "remark";
import strip from "strip-markdown";

// Prevent tabnabbing attacks by ensuring all target="_blank" links have rel="noopener noreferrer"
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function getMarkdownSummary({
  markdown,
  width,
  height,
  charWidth,
  withLinks = true,
}: {
  markdown: string;
  width: number;
  height: number;
  charWidth?: number;
  withLinks?: boolean;
}) {
  const approxCharWidth = charWidth ?? 8;
  const approxLineHeight = 20;
  const charsPerLine = Math.floor(width / approxCharWidth);
  const maxLines = Math.floor(height / approxLineHeight);
  const maxChars = charsPerLine * maxLines;

  const file = remark()
    .use(strip, { keep: withLinks ? ["link"] : [] })
    .processSync(markdown);

  markdown = String(file).split("\n").join(" ");

  let rawLength = 0;
  let result = "";
  const tokens = markdown.match(/(\[.*?\]\(.*?\)|`.*?`|.|\n)/g) || [];

  for (const token of tokens) {
    if (token.startsWith("[") && token.includes("](")) {
      // handle links markdown
      const linkText = token.match(/\[(.*?)\]/)?.[1] || "";
      const linkUrl = token.match(/\((.*?)\)/)?.[1] || "";

      if (rawLength + linkText.length > maxChars) {
        const remainingChars = maxChars - rawLength;
        result += `[${linkText.slice(0, remainingChars)}...](${linkUrl})`;
        break;
      }

      result += token;
      rawLength += linkText.length;
    } else {
      // handle raw text
      if (rawLength + token.length >= maxChars) {
        result += token.slice(0, maxChars - rawLength);
        result += "...";
        break;
      }
      result += token;
      rawLength += token.length;
    }
  }

  result = result.trimEnd();
  return result;
}

export function estimateReadingTime(markdown: string) {
  const words = markdown.split(/\s+/).length;
  const wordsPerMinute = 225;
  return Math.ceil(words / wordsPerMinute);
}

export function sanitizeHtmlContent(
  content: string,
  options?: { allowStyleTag?: boolean }
): string {
  // DOMPurify doesn't allow self-closing tags for mXSS protection
  // Our DB includes a bunch of self-closing tags for iframes, so pre-process text to expected HTML format
  const iframeRegex = /<iframe\s+([^>]*?)\s*\/>/gs;
  const processedContent = content.replace(iframeRegex, (match, attributes) => {
    return `<iframe ${attributes}></iframe>`;
  });

  const addTags = ["iframe"];
  if (options?.allowStyleTag) {
    addTags.push("style");
  }

  const purified = DOMPurify.sanitize(processedContent, {
    ADD_TAGS: addTags,
    // FORCE_BODY prevents DOMPurify from stripping <style> tags at the beginning of HTML
    FORCE_BODY: options?.allowStyleTag,
    ADD_ATTR: [
      /**
       * Attribute-driven toggle
       */
      "toggle-details",
      "ng-show",

      /**
       * Iframe attributes
       */
      "src",
      "loading",
      "style",
      "width",
      "height",
      "frameborder",
      "allowfullscreen",
      "scrolling",

      /**
       * Link attributes
       */
      "target",
      "rel",
    ],
  });

  return purified;
}
