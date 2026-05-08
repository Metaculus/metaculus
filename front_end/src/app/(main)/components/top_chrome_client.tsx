"use client";

import { FC, ReactNode, useEffect, useRef } from "react";

const TOP_CHROME_HEIGHT_CSS_VAR = "--top-chrome-height";

export const TopChromeClient: FC<{ children: ReactNode }> = ({ children }) => {
  const topChromeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const topChromeEl = topChromeRef.current;
    if (!topChromeEl) {
      return;
    }

    const updateTopChromeHeight = () => {
      document.documentElement.style.setProperty(
        TOP_CHROME_HEIGHT_CSS_VAR,
        `${topChromeEl.getBoundingClientRect().height}px`
      );
    };

    updateTopChromeHeight();

    const observer = new ResizeObserver(updateTopChromeHeight);
    observer.observe(topChromeEl);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(TOP_CHROME_HEIGHT_CSS_VAR);
    };
  }, []);

  return (
    <div
      ref={topChromeRef}
      className="fixed left-0 top-0 z-[210] w-full print:hidden"
    >
      {children}
    </div>
  );
};
