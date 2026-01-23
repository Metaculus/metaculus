"use client";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, memo, useEffect, useMemo, useState } from "react";

import {
  NOTEBOOK_COMMENTS_TITLE,
  NOTEBOOK_CONTENT_SECTION,
  NOTEBOOK_TITLE,
} from "@/app/(main)/notebooks/constants/page_sections";
import { useBreakpoint } from "@/hooks/tailwind";
import useHash from "@/hooks/use_hash";
import useSectionHeadings from "@/hooks/use_section_headings";
import cn from "@/utils/core/cn";

type Props = {
  commentsCount: number;
  unreadComments?: number;
};

const MOBILE_SCROLL_OFFSET = 66 + 48 + 16;
const DESKTOP_SCROLL_OFFSET = 66;

const NotebookContentSections: FC<Props> = ({
  commentsCount,
  unreadComments,
}) => {
  const t = useTranslations();
  const hash = useHash();

  const headings = useSectionHeadings(NOTEBOOK_CONTENT_SECTION);
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>();
  const [notebookTitle, setNotebookTitle] = useState<string | null>();
  const [isNotebookTitleVisible, setIsNotebookTitleVisible] =
    useState<boolean>(true);
  const isLargeScreen = useBreakpoint("md");
  useEffect(() => {
    for (const h of headings) {
      const el = document.getElementById(h.id);
      el?.classList.add("scroll-mt-32", "md:scroll-mt-16");
    }
    document
      .getElementById(NOTEBOOK_COMMENTS_TITLE)
      ?.classList.add("scroll-mt-32", "md:scroll-mt-16");
  }, [headings]);

  useEffect(() => {
    const notebookTitleElement = document.querySelector(
      `#${NOTEBOOK_TITLE}`
    ) as HTMLElement | null;
    setNotebookTitle(notebookTitleElement?.textContent ?? null);
  }, []);

  useEffect(() => {
    const handleOnScroll = () => {
      /** changing the table title to notebook title when it becomes invisible */
      const notebookTitleElement = document.querySelector(
        `#${NOTEBOOK_TITLE}`
      ) as HTMLElement | null;
      const pageHeaderElement = document.querySelector(
        "header"
      ) as HTMLElement | null;

      if (notebookTitleElement && pageHeaderElement) {
        const notebookTitleBottomOffsetTop =
          notebookTitleElement.offsetTop +
          notebookTitleElement.offsetHeight -
          pageHeaderElement.offsetHeight;
        setIsNotebookTitleVisible(
          window.scrollY < notebookTitleBottomOffsetTop
        );
      }
      const ids: string[] = headings.map((h) => h.id);
      ids.push(NOTEBOOK_COMMENTS_TITLE);

      const offset = isLargeScreen
        ? DESKTOP_SCROLL_OFFSET
        : MOBILE_SCROLL_OFFSET;

      const activeId = [...ids].reverse().find((id) => {
        const el = document.getElementById(id);
        if (!el) return false;

        const top = el.getBoundingClientRect().top + window.scrollY - offset;

        return window.scrollY > top;
      });
      setActiveHeadingId(activeId);
    };

    handleOnScroll();

    window.addEventListener("scroll", handleOnScroll);
    window.addEventListener("resize", handleOnScroll);

    return () => {
      window.removeEventListener("scroll", handleOnScroll);
      window.removeEventListener("resize", handleOnScroll);
    };
  }, [headings, isLargeScreen]);

  const commentsTitle = useMemo(() => {
    const commentCount = t("commentsWithCount", { count: commentsCount });
    const unreadCount = unreadComments
      ? unreadComments === commentsCount
        ? t("unreadAll")
        : `${unreadComments} ${t("unreadWithCount", { count: unreadComments })}`
      : "";
    const unreadText = unreadCount ? `(${unreadCount})` : "";
    return `${commentsCount || ""} ${commentCount} ${unreadText}`.trim();
  }, [commentsCount, unreadComments, t]);

  const activeLabel = useMemo(() => {
    if (!activeHeadingId) {
      return isNotebookTitleVisible && headings.length
        ? "Table of Contents"
        : notebookTitle ?? undefined;
    }

    if (activeHeadingId === NOTEBOOK_COMMENTS_TITLE) return commentsTitle;

    const active = headings.find((h) => h.id === activeHeadingId);
    return active?.textContent ?? notebookTitle ?? undefined;
  }, [
    activeHeadingId,
    commentsTitle,
    headings,
    isNotebookTitleVisible,
    notebookTitle,
  ]);

  const headerLabel = useMemo(() => {
    return isNotebookTitleVisible && headings.length
      ? "Table of Contents"
      : notebookTitle ?? "Table of Contents";
  }, [headings.length, isNotebookTitleVisible, notebookTitle]);

  return (
    <Popover
      as="nav"
      className="sticky top-16 z-10 flex max-h-[calc(100vh-3rem)] flex-col overflow-y-auto border-gray-300 bg-gray-0 text-sm text-blue-900 break-anywhere no-scrollbar dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-blue-900-dark max-md:flex max-md:border max-md:bg-gray-100 max-md:dark:bg-gray-100-dark md:top-12 md:-m-4 md:p-4"
    >
      {({ open, close }) => (
        <>
          <PopoverButton
            aria-label="Open table of contents"
            className="flex items-center justify-between gap-2.5 text-left focus:outline-none md:hidden"
          >
            <span className="ml-4 block flex-1 py-2 font-bold">
              {activeLabel}
            </span>

            <FontAwesomeIcon
              className={cn("p-4", { "rotate-180": open })}
              icon={faChevronDown}
            />
          </PopoverButton>

          <PopoverPanel
            static
            as="div"
            className={cn("flex flex-col", {
              "max-md:hidden": !open,
            })}
          >
            <div className="hidden items-center justify-between gap-2.5 text-left md:flex">
              <Link
                href="#"
                className={cn(
                  "block flex-1 py-2 no-underline max-md:ml-4 md:py-1",
                  {
                    "font-bold": !activeHeadingId,
                  }
                )}
              >
                {headerLabel}
              </Link>
            </div>

            <div className="flex flex-col max-md:mx-4 max-md:mb-2">
              <hr className="mb-1 mt-0 border-gray-300 dark:border-gray-300-dark md:mt-1" />
              {headings.map(({ id, textContent, tagName }) => (
                <Link
                  href={`#${id}`}
                  key={id}
                  className={cn("block py-1 no-underline", {
                    "pl-4": tagName === "H2",
                    "pl-8": tagName === "H3",
                    "font-bold": activeHeadingId === id,
                    "font-medium": activeHeadingId !== id && hash === `#${id}`,
                  })}
                  onClick={close}
                >
                  {textContent}
                </Link>
              ))}
              {!!headings.length && (
                <hr
                  className={cn(
                    "my-1 border-gray-300 dark:border-gray-300-dark",
                    { "max-md:hidden": !open }
                  )}
                />
              )}

              <Link
                href={`#${NOTEBOOK_COMMENTS_TITLE}`}
                className={cn("block py-1 no-underline", {
                  "font-bold": activeHeadingId === NOTEBOOK_COMMENTS_TITLE,
                  "font-medium":
                    activeHeadingId !== NOTEBOOK_COMMENTS_TITLE &&
                    hash === `#${NOTEBOOK_COMMENTS_TITLE}`,
                })}
                onClick={close}
              >
                {commentsTitle}
              </Link>
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export default memo(NotebookContentSections);
