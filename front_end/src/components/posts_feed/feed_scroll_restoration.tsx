import { usePathname } from "next/navigation";
import { FC, useEffect, useMemo } from "react";

import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";
import { safeSessionStorage } from "@/utils/core/storage";

import { SCROLL_CACHE_KEY } from "./constants";

type Props = {
  loadedCount: number;
  serverPage: number | null;
  pageNumber: number;
};
const PostsFeedScrollRestoration: FC<Props> = ({
  pageNumber,
  serverPage,
  loadedCount,
}) => {
  const pathname = usePathname();
  const { navigateToSearchParams } = useSearchParams();

  // disable native scroll restoration as we're doing it programmatically
  useEffect(() => {
    history.scrollRestoration = "manual";
  }, []);

  // propagate shallow page param to server on the first render
  // we skip server navigation on the feed, as pagination is executed client-side
  // but we need to ensure the server is in sync with the client when doing back navigation
  useEffect(() => {
    if (pageNumber > 1 && serverPage !== pageNumber) {
      navigateToSearchParams();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullPathname = useMemo(() => {
    if (typeof window === "undefined") return pathname;
    return window.location.pathname + window.location.search;
  }, [pathname]);

  useEffect(() => {
    const saveScrollPosition = () => {
      const currentScroll = window.scrollY;
      if (currentScroll >= 0) {
        const key = window.location.pathname + window.location.search;

        safeSessionStorage.setItem(
          SCROLL_CACHE_KEY,
          JSON.stringify({
            scrollPathName: key,
            scrollPosition: String(currentScroll),
          })
        );
      }
    };

    const saved = safeSessionStorage.getItem(SCROLL_CACHE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    const { scrollPathName, scrollPosition } = parsed as {
      scrollPathName?: string;
      scrollPosition?: string;
    };

    const minRequired = (pageNumber - 1) * POSTS_PER_PAGE;
    if (
      scrollPosition &&
      loadedCount > minRequired &&
      scrollPathName === fullPathname
    ) {
      window.scrollTo({ top: Number(scrollPosition), behavior: "auto" });
      safeSessionStorage.removeItem(SCROLL_CACHE_KEY);
    }

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(saveScrollPosition);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [fullPathname, loadedCount, pageNumber]);

  return null;
};

export default PostsFeedScrollRestoration;
