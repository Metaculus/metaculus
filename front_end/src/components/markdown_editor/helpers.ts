import { sanitizeHtmlContent } from "@/utils/markdown";

import { EMBEDDED_QUESTION_COMPONENT_NAME } from "./embedded_question";
import { EMBEDDED_TWITTER_COMPONENT_NAME } from "./embedded_twitter";
import { transformTwitterLinks } from "./embedded_twitter/helpers";

// match block math: $$...$$
const BLOCK_MATH_REGEX = /\$\$(?:[^$]|\\\$)*?\$\$/g;
// match valid inline math: $...$ with a non-word/non-backslash boundary before it
const INLINE_MATH_REGEX = /(^|[^\w\\])(\$([^\$]+?)\$(?!\w))/gs;

const isEscapedAt = (input: string, index: number): boolean => {
  let backslashCount = 0;

  for (
    let cursor = index - 1;
    cursor >= 0 && input[cursor] === "\\";
    cursor--
  ) {
    backslashCount += 1;
  }

  return backslashCount % 2 === 1;
};

const preProcessMarkdownContent = (
  markdown: string,
  {
    search,
    placeholderName,
    createPlaceholder = (id) => `___${placeholderName}_${id}___`,
  }: {
    search: string | RegExp;
    placeholderName: string;
    createPlaceholder?: (id: number) => string;
  }
) => {
  const placeholders: {
    placeholder: string;
    original: string;
  }[] = [];

  let placeholderId = 0;
  markdown = markdown.replace(search, (match) => {
    const placeholder = createPlaceholder(placeholderId++);
    placeholders.push({ placeholder, original: match });
    return placeholder;
  });

  return { markdown, placeholders };
};

// escape < and { that is not correctly used
function escapePlainTextSymbols(str: string) {
  let tempStr = str;

  // pre-process html tags
  const tagRegex = /<\/?\s*[a-zA-Z][a-zA-Z0-9-]*(?:\s+[^<>]*?)?>/g;
  const { markdown: processedTagsMarkdown, placeholders: tags } =
    preProcessMarkdownContent(tempStr, {
      search: tagRegex,
      placeholderName: "HTML_TAG",
    });
  tempStr = processedTagsMarkdown;

  // pre-process math expressions
  const blockMathExpressions: { placeholder: string; original: string }[] = [];
  let blockMathId = 0;
  tempStr = tempStr.replace(BLOCK_MATH_REGEX, (match, offset, input) => {
    if (isEscapedAt(input, offset)) {
      return match;
    }
    const placeholder = `___MATH_BLOCK_${blockMathId++}___`;
    blockMathExpressions.push({ placeholder, original: match });
    return placeholder;
  });

  const inlineMathExpressions: { placeholder: string; original: string }[] = [];
  let inlineMathId = 0;
  tempStr = tempStr.replace(
    INLINE_MATH_REGEX,
    (match, prefix, inlineMath, _content, offset, input) => {
      const inlineMathStart = offset + prefix.length;
      if (isEscapedAt(input, inlineMathStart)) {
        return match;
      }
      const placeholder = `___MATH_INLINE_${inlineMathId++}___`;
      inlineMathExpressions.push({ placeholder, original: inlineMath });
      return `${prefix}${placeholder}`;
    }
  );

  // escape < that is not correctly used
  tempStr = tempStr.replace(/([^\\])</g, "$1\\<").replace(/^</g, "\\<");

  // restore math expressions
  blockMathExpressions.forEach(({ placeholder, original }) => {
    tempStr = tempStr.replace(placeholder, () => original);
  });
  inlineMathExpressions.forEach(({ placeholder, original }) => {
    tempStr = tempStr.replace(placeholder, () => original);
  });

  // restore html tags
  tags.forEach(({ placeholder, original }) => {
    tempStr = tempStr.replace(placeholder, () => original);
  });

  // escape { that is not correctly used
  tempStr = tempStr.replace(/{(?![^}]*})/g, (match, offset, input) =>
    isEscapedAt(input, offset) ? match : `\\${match}`
  );

  return tempStr;
}

function formatBlockquoteNewlines(markdown: string): string {
  return markdown.replace(/^>\s*\n/gm, "> &#x20;\n");
}

// backwards compatibility util to handle the old mathjax syntax
const transformMathJaxToLatex = (markdown: string): string => {
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  // remove non-breaking spaces
  // syntax trigger for block math must start from new line
  markdown = markdown.replace(/\u00A0/g, " ");

  // Temporary replacements for links to avoid interfering with MathJax processing
  const links: string[] = [];
  markdown = markdown.replace(markdownLinkPattern, (match) => {
    links.push(match);
    return `__LINK_PLACEHOLDER_${links.length - 1}__`;
  });

  // convert MathJax expressions to markdown math syntax
  // \[ and \] are used for block math, \( and \) are used for inline math
  const simpleMathJaxExpression = /\\([\(\[])(.*?)(\\[\)\]])/gs;
  markdown = markdown.replace(simpleMathJaxExpression, (_match, p1, p2, p3) => {
    if (p1.includes("(") && p3.includes(")")) {
      return `$${p2}$`;
    }

    return `$$\n${p2}\n$$`;
  });

  // convert complex MathJax expressions to markdown math syntax
  // basically, wrap math expression in block syntax ($$ ... $$)
  const complexMathJaxExpression =
    /(?:^\$\$\n)?\\begin{([^}]*)}(.*?)\\end{([^}]*)}(?:\n\$\$$)?/gs;
  markdown = markdown.replace(
    complexMathJaxExpression,
    (_match, p1, p2, p3, offset, original) => {
      let content = `\\begin{${p1}}${p2}\\end{${p3}}`;

      const startsWithWrap = original.slice(offset - 3, offset) === "$$\n";
      const endsWithWrap =
        original.slice(offset + _match.length, offset + _match.length + 3) ===
        "\n$$";

      if (!startsWithWrap) {
        content = `$$\n${content}`;
      }
      if (!endsWithWrap) {
        content = `${content}\n$$`;
      }

      return content;
    }
  );

  // Restore the links
  markdown = markdown.replace(
    /__LINK_PLACEHOLDER_(\d+)__/g,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (_match, index) => links[index]!
  );

  return markdown;
};

// escape dollar signs that are not used for math
const escapeRawDollarSigns = (markdown: string): string => {
  const placeholders = new Map<string, string>();
  let placeholderIndex = 0;

  // replace block math with placeholders and ensure newlines are added
  let processedMarkdown = markdown.replace(
    BLOCK_MATH_REGEX,
    (blockMath, offset, input) => {
      if (isEscapedAt(input, offset)) {
        return blockMath;
      }
      const trimmedMath = blockMath.trim();
      const formattedMath = `\n${trimmedMath}\n`;
      const placeholder = `{{MATH_BLOCK_${placeholderIndex++}}}`;
      placeholders.set(placeholder, formattedMath);
      return placeholder;
    }
  );

  // replace valid inline math with placeholders
  processedMarkdown = processedMarkdown.replace(
    INLINE_MATH_REGEX,
    (match, prefix, inlineMath, _content, offset, input) => {
      const inlineMathStart = offset + prefix.length;
      if (isEscapedAt(input, inlineMathStart)) {
        return match;
      }
      const placeholder = `{{MATH_INLINE_${placeholderIndex++}}}`;
      placeholders.set(placeholder, inlineMath); // Save the valid inline math as is
      return `${prefix}${placeholder}`;
    }
  );

  // escape remaining dollar signs that are not part of valid math
  processedMarkdown = processedMarkdown.replace(
    /\$/g,
    (match, offset, input) => {
      if (isEscapedAt(input, offset)) {
        return match;
      }
      return "\\$";
    }
  );

  // restore all placeholders (block math and inline math)
  return processedMarkdown.replace(
    /{{MATH_(BLOCK|INLINE)_\d+}}/g,
    (placeholder) => placeholders.get(placeholder) || placeholder
  );
};

const MARKER_START = String.fromCharCode(0xe000);
const MARKER_END = String.fromCharCode(0xe001);

// Private-use delimiters plus a nonce absent from the input, so no literal
// user text can be mistaken for (or turned into) a placeholder.
function createMarkerFactory(markdown: string) {
  let nonce = 0;
  while (markdown.includes(`${MARKER_START}${nonce}`)) nonce++;
  return (name: string) => `${MARKER_START}${nonce}${name}${MARKER_END}`;
}

// Only the canonical `<Name id=… />` form skips DOMPurify
const EMBEDDED_COMPONENT_REGEX = new RegExp(
  `<(?:${EMBEDDED_QUESTION_COMPONENT_NAME}|${EMBEDDED_TWITTER_COMPONENT_NAME})\\s+id=(?:\\{\\d+\\}|"\\d+"|'\\d+')\\s*\\/>`,
  "g"
);
const VOID_TAG_REGEX =
  /<(?:hr|br|img)\s+[^>]*?\s*(?:\/>|>(?:.*?)<\/(?:hr|br|img)>)/gs;

const toSelfClosingVoidTags = (html: string) =>
  html.replace(/<(hr|br|img)\b([^>]*?)\s*\/?>/g, "<$1$2 />");

function sanitizeHtml(markdown: string) {
  const marker = createMarkerFactory(markdown);
  const ampersand = marker("amp");

  // User-authored entities must stay encoded: only text DOMPurify itself
  // escaped is decoded below, otherwise `&lt;img onerror=…&gt;` becomes markup.
  markdown = markdown.replace(/&/g, ampersand);

  const { markdown: withoutEmbeds, placeholders: embeds } =
    preProcessMarkdownContent(markdown, {
      search: EMBEDDED_COMPONENT_REGEX,
      placeholderName: "JSX_COMPONENT",
      createPlaceholder: (id) => marker(`jsx${id}`),
    });

  // DOMPurify rewrites void tags to HTML5 syntax, but MDX needs `<img />`
  const { markdown: withoutVoidTags, placeholders: voidTags } =
    preProcessMarkdownContent(withoutEmbeds, {
      search: VOID_TAG_REGEX,
      placeholderName: "SELF_CLOSING_TAG",
      createPlaceholder: (id) => marker(`void${id}`),
    });

  markdown = sanitizeHtmlContent(withoutVoidTags);

  // Void-tag chunks can contain embed placeholders, so restore them first
  voidTags.forEach(({ placeholder, original }) => {
    const sanitized = toSelfClosingVoidTags(sanitizeHtmlContent(original));
    markdown = markdown.replace(placeholder, () => sanitized);
  });
  embeds.forEach(({ placeholder, original }) => {
    markdown = markdown.replace(placeholder, () => original);
  });

  // MDXEditor needs the plain characters DOMPurify escaped in text nodes
  markdown = markdown.replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  return markdown.replaceAll(ampersand, "&");
}

// Returns MDX source for MDXEditor, not HTML-safe output: decoded `<`/`>` can
// still form markup, which the editor's safe HTML import visitor then filters.
export function processMarkdown(
  markdown: string,
  config?: { revert?: boolean; withTwitterPreview?: boolean }
): string {
  const { revert, withTwitterPreview } = config ?? {};
  markdown = formatBlockquoteNewlines(markdown);
  if (!revert) {
    markdown = transformMathJaxToLatex(markdown);
    markdown = escapeRawDollarSigns(markdown);
  }
  markdown = escapePlainTextSymbols(markdown);
  if (withTwitterPreview) {
    markdown = transformTwitterLinks(markdown);
  }

  markdown = sanitizeHtml(markdown);

  return markdown;
}
