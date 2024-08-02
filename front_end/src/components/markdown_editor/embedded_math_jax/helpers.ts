export const transformMathJax = (markdown: string): string => {
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Temporary replacements for links to avoid interfering with MathJax processing
  const links: string[] = [];
  markdown = markdown.replace(markdownLinkPattern, (match) => {
    links.push(match);
    return `__LINK_PLACEHOLDER_${links.length - 1}__`;
  });

  const simpleMathJaxExpression = /\\([\(\[])(.*?)(\\[\)\]])/gs;
  markdown = markdown.replace(simpleMathJaxExpression, (_match, p1, p2, p3) => {
    return `<EmbeddedMathJax content="\\${p1}${p2}${p3}" />`;
  });

  const complexMathJaxExpression = /\\begin{([^}]*)}(.*?)\\end{([^}]*)}/gs;
  markdown = markdown.replace(
    complexMathJaxExpression,
    (_match, p1, p2, p3) =>
      `<EmbeddedMathJax content="\\begin{${p1}}${p2}\\end{${p3}}" />`
  );

  // Restore the links
  markdown = markdown.replace(
    /__LINK_PLACEHOLDER_(\d+)__/g,
    (_match, index) => links[index]
  );

  return markdown;
};

export const revertMathJaxTransform = (jsxString: string): string => {
  const simpleMathJaxExpression =
    /<EmbeddedMathJax content="\\([\(\[])(.*?)\\([\)\]])" \/>/gs;

  jsxString = jsxString.replace(
    simpleMathJaxExpression,
    (_match, p1, p2, p3) => `\\${p1}${p2}\\${p3}`
  );

  const complexMathJaxExpression =
    /<EmbeddedMathJax\s+content="\s*\\begin{([^}]*)}(.*?)\\end{([^}]*)}\s*"\s*\/>/gs;
  jsxString = jsxString.replace(
    complexMathJaxExpression,
    (_match, p1, p2, p3) => `\\begin{${p1}}${p2}\\end{${p3}}`
  );

  return jsxString;
};
