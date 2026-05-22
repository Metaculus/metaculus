import { useEffect, useRef, useState } from "react";

// 21px matches the -top-[21px] / -left-[21px] offset used on the overlay
const OVERLAY_OFFSET = 21;
const BOTTOM_MARGIN = 16;
const MIN_HEIGHT = 200;

export function useOverlayMaxHeight(expanded: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayMaxHeight, setOverlayMaxHeight] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    if (!expanded || !containerRef.current) return;

    const recompute = () => {
      if (!containerRef.current) return;
      const { top } = containerRef.current.getBoundingClientRect();
      setOverlayMaxHeight(
        Math.max(
          window.innerHeight - (top - OVERLAY_OFFSET) - BOTTOM_MARGIN,
          MIN_HEIGHT
        )
      );
    };

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [expanded]);

  return { containerRef, overlayMaxHeight };
}
