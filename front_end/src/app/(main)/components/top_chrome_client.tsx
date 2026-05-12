"use client";

import { FC, ReactNode, useEffect, useRef } from "react";

import { logError } from "@/utils/core/errors";

const TOP_CHROME_HEIGHT_CSS_VAR = "--top-chrome-height";

export const TopChromeClient: FC<{ children: ReactNode }> = ({ children }) => {
  const topChromeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const topChromeEl = topChromeRef.current;
    if (!topChromeEl) {
      return;
    }

    const updateTopChromeHeight = () => {
      try {
        document.documentElement.style.setProperty(
          TOP_CHROME_HEIGHT_CSS_VAR,
          `${topChromeEl.getBoundingClientRect().height}px`
        );
      } catch (error) {
        logError(error, {
          message: "Failed to measure top chrome height",
        });
      }
    };

    updateTopChromeHeight();

    if (typeof ResizeObserver === "undefined") {
      if (typeof MutationObserver === "undefined") {
        return () => {
          document.documentElement.style.removeProperty(
            TOP_CHROME_HEIGHT_CSS_VAR
          );
        };
      }

      const observer = new MutationObserver(updateTopChromeHeight);
      let isObserving = false;
      try {
        observer.observe(topChromeEl, {
          attributes: true,
          childList: true,
          subtree: true,
        });
        isObserving = true;
      } catch (error) {
        logError(error, {
          message: "Failed to observe top chrome height",
        });
      }
      window.addEventListener("resize", updateTopChromeHeight);

      return () => {
        if (isObserving) {
          observer.disconnect();
        }
        window.removeEventListener("resize", updateTopChromeHeight);
        document.documentElement.style.removeProperty(
          TOP_CHROME_HEIGHT_CSS_VAR
        );
      };
    }

    const observer = new ResizeObserver(updateTopChromeHeight);
    try {
      observer.observe(topChromeEl);
    } catch (error) {
      logError(error, {
        message: "Failed to observe top chrome height",
      });
    }

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
