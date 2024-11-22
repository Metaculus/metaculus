import { usePathname } from "next/navigation";
import { FC, useEffect } from "react";

import useSearchParams from "@/hooks/use_search_params";
import { PostWithForecasts } from "@/types/post";

type Props = {
  initialQuestions: PostWithForecasts[];
  pageNumber: number;
};
const PostsFeedScrollRestoration: FC<Props> = ({
  initialQuestions,
  pageNumber,
}) => {
  const pathname = usePathname();
  const { params } = useSearchParams();
  const fullPathname = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;

  useEffect(() => {
    const cacheKey = `feed-scroll-restoration`;
    let timeoutId = undefined;
    const saveScrollPosition = () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 0) {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            scrollPathName: fullPathname,
            scrollPosition: currentScroll.toString(),
          })
        );
      }
    };

    const savedScrollData = sessionStorage.getItem(cacheKey);
    const parsedScrollData = savedScrollData ? JSON.parse(savedScrollData) : {};
    const { scrollPathName, scrollPosition } = parsedScrollData;
    if (
      scrollPosition &&
      initialQuestions.length > 0 &&
      !!pageNumber &&
      scrollPathName === fullPathname
    ) {
      timeoutId = setTimeout(() => {
        console.log("SCROLLING");
        window.scrollTo({
          top: parseInt(scrollPosition),
          behavior: "smooth",
        });

        sessionStorage.removeItem(cacheKey);
        window.addEventListener("scrollend", saveScrollPosition);
      }, 1000);
    } else {
      window.addEventListener("scrollend", saveScrollPosition);
    }

    return () => {
      window.removeEventListener("scrollend", saveScrollPosition);
      timeoutId && clearTimeout(timeoutId);
    };
  }, [fullPathname, initialQuestions.length, pageNumber]);
  return null;
};

export default PostsFeedScrollRestoration;
