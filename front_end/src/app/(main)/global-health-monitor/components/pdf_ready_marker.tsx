"use client";

import { useEffect, useState } from "react";

/**
 * Holds the PDF screenshot until the charts have drawn. They only render once hydration measures
 * their width, and the screenshot service doesn't wait for hydration: on a slow box it printed
 * every chart blank. `data-loading` stays in the server HTML until this has mounted and the
 * charts have had two frames to measure.
 */
export function PdfReadyMarker() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setIsReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return isReady ? null : <span hidden data-loading="true" />;
}
