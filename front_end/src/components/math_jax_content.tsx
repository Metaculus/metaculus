"use client";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import React, { FC } from "react";

type Props = {
  content: string;
};

const MathJaxContent: FC<Props> = ({ content }) => {
  return (
    <MathJaxContext>
      <MathJax>{content}</MathJax>
    </MathJaxContext>
  );
};

export default MathJaxContent;
