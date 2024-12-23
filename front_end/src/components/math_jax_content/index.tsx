"use client";
import "./styles.css";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import dynamic from "next/dynamic";
import React, { FC } from "react";

type Props = {
  content: string;
  block?: boolean;
};

const MathJaxContent: FC<Props> = ({ content, block = false }) => {
  return (
    <MathJaxContext>
      <MathJax
        style={{
          display: block ? "block" : "inline-block",
        }}
      >
        {content}
      </MathJax>
    </MathJaxContext>
  );
};

// Exporting the component using dynamic import with ssr: false
export default dynamic(() => Promise.resolve(MathJaxContent), {
  ssr: false,
});
