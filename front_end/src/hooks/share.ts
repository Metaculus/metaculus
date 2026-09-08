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
    let base: URL | null = null;

    if (PUBLIC_APP_URL) {
      try {
        base = new URL(PUBLIC_APP_URL);
      } catch {
        // fall through to window.location.origin below
      }
    }

    if (!base && typeof window !== "undefined" && window.location?.origin) {
      try {
        base = new URL(window.location.origin);
      } catch {
        // fall through to the warn + empty return below
      }
    }

    const search = searchParams.toString();
    const appliedHash = includeHash ? hash : "";

    if (!base) {
      console.warn(
        "useCurrentUrl: unable to resolve a base URL — PUBLIC_APP_URL is missing or invalid and window.location is unavailable. Falling back to a relative URL."
      );
      return `${pathname}${search ? `?${search}` : ""}${appliedHash}`;
    }

    base.pathname = pathname;
    base.search = search;
    base.hash = appliedHash;
    return base.toString();
  }, [PUBLIC_APP_URL, hash, includeHash, pathname, searchParams]);
};

type CopyUrlOptions = CurrentUrlOptions & {
  /** Localized success toast. Defaults to the original English string. */
  successMessage?: string;
  /** Localized failure toast. Omit to keep the log-only behavior. */
  errorMessage?: string;
};

export const useCopyUrl = ({
  successMessage = "URL is now copied to your clipboard",
  errorMessage,
  ...urlOptions
}: CopyUrlOptions = {}) => {
  const url = useCurrentUrl(urlOptions);

  return useCallback(() => {
    if (!url) return;

    // `navigator.clipboard` is undefined outside a secure context — plain http
    // on a LAN address, for instance — so reading `.writeText` off it throws
    // synchronously, where the promise's catch below cannot see it and the
    // click ends in an uncaught error instead of a toast.
    if (!navigator.clipboard?.writeText) {
      console.error("Error copying link: clipboard unavailable");
      if (errorMessage) {
        toast.error(errorMessage);
      }
      return;
    }

    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast(successMessage, {
          className: "dark:bg-blue-700-dark dark:text-gray-0-dark",
        });
      })
      .catch((err) => {
        console.error("Error copying link: ", err);
        // Clipboard writes fail for real reasons — denied permission, a
        // non-secure context — and a click that silently does nothing reads as a
        // broken button. Callers that pass a message get told.
        if (errorMessage) {
          toast.error(errorMessage);
        }
      });
  }, [url, successMessage, errorMessage]);
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
