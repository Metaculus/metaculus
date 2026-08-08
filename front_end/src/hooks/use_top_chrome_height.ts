"use client";

import { useEffect, useState } from "react";

import { logError } from "@/utils/core/errors";

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

    const observer =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(updateTopChromeHeight);
    let isObserving = false;
    try {
      observer?.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
      isObserving = !!observer;
    } catch (error) {
      logError(error, {
        message: "Failed to observe top chrome height",
      });
    }
    window.addEventListener("resize", updateTopChromeHeight);

    return () => {
      if (isObserving) {
        observer?.disconnect();
      }
      window.removeEventListener("resize", updateTopChromeHeight);
    };
  }, []);

  return topChromeHeight;
};
