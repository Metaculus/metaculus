import { usePathname } from "next/navigation";
import { FC, useEffect } from "react";

import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";
import { PostWithForecasts } from "@/types/post";
import { safeSessionStorage } from "@/utils/core/storage";

import { SCROLL_CACHE_KEY } from "./constants";

type Props = {
  initialQuestions: PostWithForecasts[];
  serverPage: number | null;
  pageNumber: number;
};
const PostsFeedScrollRestoration: FC<Props> = ({
  initialQuestions,
  pageNumber,
  serverPage,
}) => {
  const pathname = usePathname();
  const { params, navigateToSearchParams } = useSearchParams();
  const fullPathname = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;

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

  useEffect(() => {
    const saveScrollPosition = () => {
      const currentScroll = window.scrollY;
      if (currentScroll >= 0) {
        safeSessionStorage.setItem(
          SCROLL_CACHE_KEY,
          JSON.stringify({
            scrollPathName: fullPathname,
            scrollPosition: currentScroll.toString(),
          })
        );
      }
    };

    const savedScrollData = safeSessionStorage.getItem(SCROLL_CACHE_KEY);
    const parsedScrollData = savedScrollData ? JSON.parse(savedScrollData) : {};
    const { scrollPathName, scrollPosition } = parsedScrollData;

    const minRequiredQuestions = (pageNumber - 1) * POSTS_PER_PAGE;
    if (
      scrollPosition &&
      initialQuestions.length > minRequiredQuestions &&
      !!pageNumber &&
      scrollPathName === fullPathname
    ) {
      window.scrollTo({
        top: parseInt(scrollPosition),
        behavior: "smooth",
      });

      safeSessionStorage.removeItem(SCROLL_CACHE_KEY);
      window.addEventListener("scrollend", saveScrollPosition);
    } else {
      window.addEventListener("scrollend", saveScrollPosition);
    }

    return () => {
      window.removeEventListener("scrollend", saveScrollPosition);
    };
  }, [fullPathname, initialQuestions.length, pageNumber]);

  return null;
};

export default PostsFeedScrollRestoration;
