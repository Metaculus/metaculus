"use client";
import { useEffect, useState } from "react";

const useEmbedUrl = (path: string) => {
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => {
    if (process) {
      let protocol = "https:";
      const host = window.location.host;
      if (host.indexOf("localhost") > -1) {
        protocol = "http:";
      }

      setOrigin(`${protocol}//${host}`);
    }
  }, []);

  return origin ? `${origin}${path}` : null;
};

export default useEmbedUrl;
