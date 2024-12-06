"use client";

import { useCallback } from "react";

const headerOffset = 48;
const extraOffset = 12;
export const COMMENT_SCROLL_OFFSET = headerOffset + extraOffset;

const useScrollTo = () => {
  return useCallback((top: number, behavior: ScrollBehavior = "smooth") => {
    const y = top + window.scrollY - COMMENT_SCROLL_OFFSET;

    window.scrollTo({ top: y, behavior });
  }, []);
};

export default useScrollTo;
