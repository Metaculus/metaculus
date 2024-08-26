import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    MathJax: any;
  }
}

interface CustomMathJaxProps {
  children: string;
}

const CustomMathJax: React.FC<CustomMathJaxProps> = ({ children }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (typeof window.MathJax !== "undefined") {
        window.MathJax.Hub.Queue([
          "Typeset",
          window.MathJax.Hub,
          nodeRef.current,
        ]);
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (typeof window.MathJax !== "undefined") {
      window.MathJax.Hub.Queue([
        "Typeset",
        window.MathJax.Hub,
        nodeRef.current,
      ]);
    }
  }, [children]);

  return <div ref={nodeRef}>{children}</div>;
};

export default CustomMathJax;
