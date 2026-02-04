"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export const useCopyUrl = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
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
  }, [pathname, searchParams]);
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

export const useShareOnTwitterLink = (message = "") => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const url = `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      message
    )}&url=${encodeURIComponent(url)}`;
  }, [message, pathname, searchParams]);
};

export const useShareOnFacebookLink = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const url = `${window.location.origin}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }, [pathname, searchParams]);
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
