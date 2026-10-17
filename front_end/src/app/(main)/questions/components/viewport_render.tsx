"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
};

const ViewportRender: React.FC<Props> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const timeoutId = window.setTimeout(() => setHasEnteredViewport(true), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "800px 0px",
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {hasEnteredViewport ? (
        children
      ) : (
        <div
          aria-hidden
          className="min-h-[32rem] animate-pulse rounded bg-gray-100 dark:bg-gray-100-dark"
        />
      )}
    </div>
  );
};

export default ViewportRender;
