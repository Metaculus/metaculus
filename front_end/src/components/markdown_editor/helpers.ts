import { transformTwitterLinks } from "./embedded_twitter/helpers";

// escape < and { that is not correctly used
function escapePlainTextSymbols(str: string) {
  const tags: any = [];
  const tagRegex = /<\/?\s*[a-zA-Z][a-zA-Z0-9-]*(?:\s+[^<>]*?)?>/g;
  let tempStr = str.replace(tagRegex, function (match) {
    tags.push(match);
    return "___HTML_TAG___";
  });

  tempStr = tempStr.replace(/([^\\])</g, "$1\\<").replace(/^</g, "\\<");

  let index = 0;
  tempStr = tempStr.replace(/___HTML_TAG___/g, function () {
    return tags[index++];
  });

  tempStr = tempStr
    .replace(/([^{]){(?![^}]*})/g, "$1\\{")
    .replace(/^{(?![^}]*})/g, "\\{");

  return tempStr;
}

function formatBlockquoteNewlines(markdown: string): string {
  return markdown.replace(/>\s*\n/g, "> \u00A0\n");
}

// backwards compatibility util to handle the old mathjax syntax
const transformMathJaxToLatex = (markdown: string): string => {
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

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
export const escapeRawDollarSigns = (markdown: string): string => {
  // match block math: $$...$$
  const blockMathRegex = /\$\$[^$]*\$\$/g;

  // match valid inline math: $...$ that doesn't end with space or parentheses, allowing end of string
  const inlineMathRegex = /(?<!\S)\$([^\$]+?)\$(?!\S)/g;

  const placeholders = new Map<string, string>();
  let placeholderIndex = 0;

  // replace block math with placeholders
  let processedMarkdown = markdown.replace(blockMathRegex, (blockMath) => {
    const placeholder = `{{MATH_BLOCK_${placeholderIndex++}}}`;
    placeholders.set(placeholder, blockMath);
    return placeholder;
  });

  // replace valid inline math with placeholders
  processedMarkdown = processedMarkdown.replace(inlineMathRegex, (match) => {
    const placeholder = `{{MATH_INLINE_${placeholderIndex++}}}`;
    placeholders.set(placeholder, match); // Save the valid inline math as is
    return placeholder;
  });

  // escape remaining dollar signs that are not part of valid math
  processedMarkdown = processedMarkdown.replace(/(?<!\\)\$/g, "\\$");

  // restore all placeholders (block math and inline math)
  return processedMarkdown.replace(
    /{{MATH_(BLOCK|INLINE)_\d+}}/g,
    (placeholder) => placeholders.get(placeholder) || placeholder
  );
};

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

  return markdown;
}
