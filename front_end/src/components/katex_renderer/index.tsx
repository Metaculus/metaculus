"use client";
import "katex/dist/katex.min.css";
import "./styles.css";
import katex from "katex";
import * as React from "react";
import { FC, useEffect, useRef } from "react";

type Props = {
  equation: string;
  inline: boolean;
  onClick?: () => void;
};

const KatexRenderer: FC<Props> = ({ equation, inline, onClick }) => {
  const katexElementRef = useRef(null);

  useEffect(() => {
    const katexElement = katexElementRef.current;

    if (katexElement !== null) {
      katex.render(equation, katexElement, {
        displayMode: !inline, // true === block display //
        errorColor: "#cc0000",
        output: "html",
        strict: "warn",
        throwOnError: false,
        trust: false,
      });
    }
  }, [equation, inline]);

  return (
    <span
      role={!!onClick ? "button" : "math"}
      tabIndex={-1}
      onClick={onClick}
      ref={katexElementRef}
      className="!whitespace-normal"
    />
  );
};

export default KatexRenderer;
