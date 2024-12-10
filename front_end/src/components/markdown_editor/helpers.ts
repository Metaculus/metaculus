import {
  revertMathJaxTransform,
  transformMathJax,
} from "./embedded_math_jax/helpers";

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

export function processMarkdown(
  markdown: string,
  revert: boolean = false
): string {
  markdown = formatBlockquoteNewlines(markdown);
  markdown = revert
    ? revertMathJaxTransform(markdown)
    : transformMathJax(markdown);
  markdown = escapePlainTextSymbols(markdown);

  return markdown;
}
