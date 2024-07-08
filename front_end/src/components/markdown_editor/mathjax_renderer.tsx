import { MathJax, MathJaxContext } from "better-react-mathjax";
import React from "react";

const mathJaxConfig = {
  loader: { load: ["[tex]/color"] },
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    packages: { "[+]": ["color"] },
  },
};

type MathJaxRendererProps = {
  content: string;
};

const MathJaxRenderer: React.FC<MathJaxRendererProps> = ({ content }) => (
  <MathJaxContext config={mathJaxConfig}>
    <MathJax dynamic>{content}</MathJax>
  </MathJaxContext>
);

export default MathJaxRenderer;
