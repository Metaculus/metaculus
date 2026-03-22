"use client";

import { useLayoutEffect } from "react";

export default function ForceLightMode() {
  useLayoutEffect(() => {
    const html = document.documentElement;

    // Remove dark class immediately
    html.classList.remove("dark");

    // Prevent next-themes (or anything else) from re-adding it
    const observer = new MutationObserver(() => {
      if (html.classList.contains("dark")) {
        html.classList.remove("dark");
      }
    });

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      // Restore dark mode if the user's saved preference requires it
      const saved = localStorage.getItem("theme");
      if (
        saved === "dark" ||
        (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) ||
        (saved === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        html.classList.add("dark");
      }
    };
  }, []);

  return null;
}
