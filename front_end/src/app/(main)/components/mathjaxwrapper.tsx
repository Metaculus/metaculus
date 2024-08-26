"use client";

import React from "react";
import CustomMathJax from "./custommathjax";

interface MathJaxWrapperProps {
  children: string;
}

const MathJaxWrapper: React.FC<MathJaxWrapperProps> = ({ children }) => {
  return <CustomMathJax>{children}</CustomMathJax>;
};

export default MathJaxWrapper;
