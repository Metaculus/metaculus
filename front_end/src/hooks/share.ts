"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { usePublicSettings } from "@/contexts/public_settings_context";

type CurrentUrlOptions = {
  includeHash?: boolean;
};

const useWindowHash = () => {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return hash;
};

const useCurrentUrl = ({ includeHash = true }: CurrentUrlOptions = {}) => {
  const { PUBLIC_APP_URL } = usePublicSettings();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hash = useWindowHash();

  return useMemo(() => {
    const url = new URL(PUBLIC_APP_URL);
    const search = searchParams.toString();

    url.pathname = pathname;
    url.search = search;
    url.hash = includeHash ? hash : "";

    return url.toString();
  }, [PUBLIC_APP_URL, hash, includeHash, pathname, searchParams]);
};

export const useCopyUrl = (options: CurrentUrlOptions = {}) => {
  const url = useCurrentUrl(options);

  return useCallback(() => {
    if (url) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast("URL is now copied to your clipboard", {
            className: "dark:bg-blue-700-dark dark:text-gray-0-dark",
          });
          // Optionally, show a notification to the user that the link was copied.
        })
        .catch((err) => console.error("Error copying link: ", err));
    }
  }, [url]);
};

export const useMetaImageUrl = (tagName: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const metaTag = document.querySelector(`meta[name='${tagName}']`);
    if (metaTag) {
      setImageUrl(metaTag.getAttribute("content"));
    }
  }, [tagName]);

  return imageUrl;
};

export const useShareOnTwitterLink = (
  message = "",
  options: CurrentUrlOptions = {}
) => {
  const url = useCurrentUrl(options);

  return useMemo(() => {
    return `https://x.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
  }, [message, url]);
};

export const useShareOnFacebookLink = (options: CurrentUrlOptions = {}) => {
  const url = useCurrentUrl(options);

  return useMemo(() => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }, [url]);
};

export const useEmbedUrl = (path: string) => {
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => {
    let protocol = "https:";
    const host = window.location.host;
    if (host.indexOf("localhost") > -1) {
      protocol = "http:";
    }

    setOrigin(`${protocol}//${host}`);
  }, []);

  return origin ? `${origin}${path}` : null;
};
