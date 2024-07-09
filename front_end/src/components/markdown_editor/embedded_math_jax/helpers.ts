export const transformMathJax = (markdown: string): string => {
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
