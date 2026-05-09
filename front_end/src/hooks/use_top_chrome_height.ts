"use client";

import { useEffect, useState } from "react";

const TOP_CHROME_HEIGHT_CSS_VAR = "--top-chrome-height";
const DEFAULT_TOP_CHROME_HEIGHT_PX = 48;

export const getTopChromeHeightPx = () => {
  if (typeof window === "undefined") {
    return DEFAULT_TOP_CHROME_HEIGHT_PX;
  }

  const rawValue = getComputedStyle(document.documentElement)
    .getPropertyValue(TOP_CHROME_HEIGHT_CSS_VAR)
    .trim();
  const parsedValue = Number.parseFloat(rawValue);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : DEFAULT_TOP_CHROME_HEIGHT_PX;
};

export const useTopChromeHeightPx = () => {
  const [topChromeHeight, setTopChromeHeight] = useState(
    DEFAULT_TOP_CHROME_HEIGHT_PX
  );

  useEffect(() => {
    const updateTopChromeHeight = () => {
      setTopChromeHeight(getTopChromeHeightPx());
    };

    updateTopChromeHeight();

    const observer = new MutationObserver(updateTopChromeHeight);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    window.addEventListener("resize", updateTopChromeHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTopChromeHeight);
    };
  }, []);

  return topChromeHeight;
};
