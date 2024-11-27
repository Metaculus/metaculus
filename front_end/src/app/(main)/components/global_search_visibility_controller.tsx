"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalSearchVisibilityController({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.setAttribute(
          "data-existing-search-visible",
          entry.isIntersecting.toString()
        );
      },
      { threshold: 0.1 }
    );

    const checkAndObserve = () => {
      const existingSearchElement = document.querySelector("#existing-search");
      if (existingSearchElement) {
        console.log("Existing search element found, observing");
        observer.observe(existingSearchElement);
      } else {
        console.log("Existing search element not found");
        document.body.setAttribute("data-existing-search-visible", "false");
      }
    };

    // Run the check immediately
    checkAndObserve();

    // Set up a small delay to recheck, useful for after route changes
    const timeoutId = setTimeout(checkAndObserve, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [pathname]); // Re-run effect when pathname changes

  return <>{children}</>;
}
