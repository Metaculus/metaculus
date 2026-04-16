"use client";

import { faXTwitter } from "@fortawesome/free-brands-svg-icons";
import {
  faEllipsis,
  faArrowUpRightFromSquare,
  faFileImage,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveAs } from "file-saver";
import { toPng } from "html-to-image";
import { ReactNode } from "react";
import { ComponentProps, useCallback, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { MetaculusTextLogo } from "@/app/(main)/components/MetaculusTextLogo";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { DownloadAggregationMethod } from "@/types/question";
import cn from "@/utils/core/cn";

import { reactNodeToText } from "./helpers";

function formatCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const dropdownItemClassName =
  "flex w-full items-center justify-end gap-2 whitespace-nowrap border-b border-blue-400 px-4 py-1.5 text-sm text-blue-800 hover:bg-blue-100 last:border-b-0 dark:border-blue-400-dark dark:text-blue-800-dark dark:hover:bg-blue-100-dark";

const iconClassName = "w-4 text-blue-700/50 dark:text-blue-700-dark/50";

// Custom menu item component that renders name with icon
function MenuItemWithIcon({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: typeof faXTwitter;
  onClick?: () => void;
}) {
  return (
    <button className={dropdownItemClassName} onClick={onClick}>
      <span>{label}</span>
      <FontAwesomeIcon icon={icon} className={iconClassName} />
    </button>
  );
}

// Custom link menu item component
function MenuLinkWithIcon({
  label,
  icon,
  href,
  openNewTab,
}: {
  label: string;
  icon: typeof faXTwitter;
  href: string;
  openNewTab?: boolean;
}) {
  return (
    <a
      href={href}
      target={openNewTab ? "_blank" : undefined}
      rel="noreferrer"
      className={cn(dropdownItemClassName, "no-underline")}
    >
      <span>{label}</span>
      <FontAwesomeIcon icon={icon} className={iconClassName} />
    </a>
  );
}

export function MoreButton({
  postIds,
  postTitle,
  onExportPng,
}: {
  postIds: number[];
  postTitle?: string;
  onExportPng?: () => void;
}) {
  const [isCsvDownloading, setIsCsvDownloading] = useState(false);

  const hasMultiplePosts = postIds.length > 1;
  const singlePostId = postIds.length === 1 ? postIds[0] : undefined;

  // Generate question URL (only for single post)
  const questionUrl = useMemo(() => {
    if (typeof window !== "undefined" && singlePostId) {
      return `${window.location.origin}/questions/${singlePostId}`;
    }
    return null;
  }, [singlePostId]);

  // View questions link - single post or multiple posts with ids param
  const viewQuestionsHref = useMemo(() => {
    if (hasMultiplePosts) {
      return `/questions?ids=${postIds.join(",")}`;
    }
    if (singlePostId) {
      return `/questions/${singlePostId}`;
    }
    return null;
  }, [hasMultiplePosts, postIds, singlePostId]);

  // Twitter share link for this specific question (only for single post)
  const shareOnTwitterLink = useMemo(() => {
    if (questionUrl && postTitle) {
      const message = `${postTitle} #metaculus`;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        message
      )}&url=${encodeURIComponent(questionUrl)}`;
    }
    return null;
  }, [questionUrl, postTitle]);

  const handleExportCsv = useCallback(async () => {
    if (isCsvDownloading || postIds.length === 0) {
      return;
    }

    setIsCsvDownloading(true);
    const loadingToastId = toast.loading(
      "Preparing CSV export. Your download will start shortly."
    );

    try {
      const blob = await ClientPostsApi.getPostZipData({
        ...(postIds.length === 1
          ? { post_id: postIds[0] }
          : { post_ids: postIds }),
        aggregation_methods: [DownloadAggregationMethod.recency_weighted],
        minimize: true,
        include_comments: false,
        include_scores: false,
        include_user_data: false,
        include_key_factors: false,
      });
      const defaultTitle =
        postIds.length > 1 ? `metaculus_data_${postIds.length}_posts` : "data";
      const filename = `${(postTitle || defaultTitle).replaceAll(" ", "_")}.zip`;
      saveAs(blob, filename);
      toast.dismiss(loadingToastId);
      toast.success("CSV download started.");
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(
        `Failed to export CSV${error instanceof Error ? `: ${error.message}` : ""}`
      );
    } finally {
      setIsCsvDownloading(false);
    }
  }, [isCsvDownloading, postIds, postTitle]);

  const moreMenuItems: MenuItemProps[] = [
    ...(viewQuestionsHref
      ? [
          {
            id: "view-question",
            name: hasMultiplePosts ? "View Questions" : "View Question",
            element: (
              <MenuLinkWithIcon
                label={hasMultiplePosts ? "View Questions" : "View Question"}
                icon={faArrowUpRightFromSquare}
                href={viewQuestionsHref}
              />
            ),
          },
        ]
      : []),
    // Export PNG using html-to-image
    ...(onExportPng
      ? [
          {
            id: "export-png",
            name: "Export PNG",
            element: (
              <MenuItemWithIcon
                label="Export PNG"
                icon={faFileImage}
                onClick={onExportPng}
              />
            ),
          },
        ]
      : []),
    // Export CSV supports single or multiple posts
    ...(postIds.length > 0
      ? [
          {
            id: "export-csv",
            name: "Export CSV",
            element: (
              <MenuItemWithIcon
                label="Export CSV"
                icon={faFileCsv}
                onClick={handleExportCsv}
              />
            ),
          },
        ]
      : []),
    // Share on X only for single post
    ...(shareOnTwitterLink
      ? [
          {
            id: "share-twitter",
            name: "Share on X",
            element: (
              <MenuLinkWithIcon
                label="Share on X"
                icon={faXTwitter}
                href={shareOnTwitterLink}
                openNewTab
              />
            ),
          },
        ]
      : []),
  ];

  if (postIds.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu
        items={moreMenuItems}
        textAlign="right"
        className="min-w-36 overflow-hidden rounded-md border-blue-400 bg-gray-0 dark:border-blue-400-dark dark:bg-gray-0-dark"
      >
        <Button
          aria-label="more options"
          size="md"
          presentationType="icon"
          className="border-transparent bg-transparent text-blue-700 hover:!bg-blue-400 group-hover/card:bg-blue-200 data-[open]:!bg-blue-700 data-[open]:!text-gray-0 dark:border-transparent dark:bg-transparent dark:text-blue-700-dark dark:hover:!bg-blue-400-dark dark:group-hover/card:bg-blue-200-dark dark:data-[open]:!bg-blue-700-dark dark:data-[open]:!text-gray-0-dark"
        >
          <FontAwesomeIcon icon={faEllipsis} />
        </Button>
      </DropdownMenu>
    </>
  );
}

/**
 * Skeleton loader for the question card while data is being fetched
 */
export function QuestionCardSkeleton({
  variant = "secondary",
  className,
}: {
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <div
      data-loading="true"
      className={cn(
        "animate-pulse",
        variant === "primary" &&
          "rounded-md bg-gray-0 p-5 dark:bg-gray-0-dark lg:p-8",
        variant === "secondary" &&
          "rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 lg:p-6",
        className
      )}
    >
      {/* Title skeleton */}
      <div
        className={cn(
          "mb-2 rounded",
          variant === "primary" ? "h-5 w-3/4 md:h-7" : "h-5 w-2/3",
          "bg-gray-300 dark:bg-gray-600"
        )}
      />
      {/* Content skeleton */}
      <div className="mt-4 w-full">
        <div className="flex flex-col gap-3">
          <div className="h-24 w-full rounded bg-gray-300 dark:bg-gray-600" />
          <div className="h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-600" />
        </div>
      </div>
    </div>
  );
}

export function QuestionCard({
  className,
  children,
  title,
  subtitle,
  subtitleClassName,
  variant = "secondary",
  titleVariantOverride,
  titleClassName,
  showMoreButton = true,
  postIds = [],
  ...props
}: Omit<ComponentProps<"div">, "title"> & {
  title?: ReactNode;
  subtitle?: string;
  subtitleClassName?: string;
  variant?: "secondary" | "primary" | "section";
  titleVariantOverride?: "secondary" | "primary" | "section";
  titleClassName?: string;
  showMoreButton?: boolean;
  /** Post IDs for actions (view, export, share) */
  postIds?: number[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleVariant = titleVariantOverride ?? variant;

  const titleString = useMemo(() => reactNodeToText(title), [title]);

  const handleExportPng = useCallback(() => {
    if (!cardRef.current) return;

    const node = cardRef.current;

    // Set CSS variables on the node before toPng clones it
    node.style.setProperty("--ss-visible", "visible");
    node.style.setProperty("--ss-hidden", "hidden");

    toPng(node, {
      pixelRatio: 2,
      style: {
        margin: "0px",
        borderRadius: "0px",
      },
    })
      .then((dataUrl: string) => {
        const link = document.createElement("a");
        link.download = `${titleString ? titleString.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "-") : "question-card"}.png`;
        link.href = dataUrl;
        link.click();
        toast("Image downloaded successfully", {
          className: "dark:bg-blue-700-dark dark:text-gray-0-dark",
        });
      })
      .catch((err: any) => {
        console.error("Error exporting image:", err);
        toast.error("Failed to export image");
      })
      .finally(() => {
        // Clean up CSS variables after toPng completes
        node.style.removeProperty("--ss-visible");
        node.style.removeProperty("--ss-hidden");
      });
  }, [titleString]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "group/card relative min-w-0 break-inside-avoid print:border print:border-gray-300 print:p-4",
        variant === "primary" &&
          "rounded-md bg-gray-0 p-5 dark:bg-gray-0-dark lg:p-8",
        variant === "secondary" &&
          "rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 lg:p-6",
        variant === "section" &&
          "rounded-md bg-gray-0 p-5 dark:bg-gray-0-dark md:p-10 print:px-0 print:py-4",
        className
      )}
      {...props}
    >
      {showMoreButton && postIds.length > 0 && (
        <div
          className={cn(
            "absolute right-4 top-4 z-10 [visibility:var(--ss-hidden,visible)] print:hidden",
            variant === "section"
              ? "md:right-8 md:top-8"
              : "lg:right-5 lg:top-5"
          )}
        >
          <MoreButton
            postIds={postIds}
            postTitle={titleString}
            onExportPng={handleExportPng}
          />
        </div>
      )}
      {title && (
        <h3
          className={cn(
            "my-0 w-full font-[450] leading-tight [text-wrap:pretty]",
            titleVariant === "primary" &&
              "pr-12 text-lg text-blue-800 dark:text-blue-800-dark md:text-2xl",
            titleVariant === "secondary" &&
              "pr-8 text-base text-gray-800 dark:text-gray-800-dark",
            titleVariant === "section" &&
              "mb-3 break-after-avoid text-lg font-medium tracking-tight text-blue-800 dark:text-blue-800-dark md:text-3xl md:font-bold print:text-2xl print:font-bold",
            titleClassName
          )}
        >
          {title}
        </h3>
      )}
      {subtitle && (
        <p
          className={cn(
            "w-full font-[450] leading-tight [text-wrap:pretty]",
            variant === "primary" &&
              "text-base text-blue-600 dark:text-blue-600-dark",
            variant === "secondary" &&
              "text-sm text-gray-600 dark:text-gray-600-dark",
            variant === "section" &&
              "text-xs text-blue-600 dark:text-blue-600-dark md:mx-auto md:text-center md:text-base md:text-blue-700 md:dark:text-blue-700-dark",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
      <div className={cn("w-full", variant !== "section" && "mt-4")}>
        {children}
      </div>

      {/* Footer with Metaculus attribution */}
      <div className="-mb-4 mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-500 [visibility:var(--ss-visible,hidden)] dark:text-gray-500-dark">
        <span>Data from</span>
        <MetaculusTextLogo className="h-3 w-auto" />
        <span>on {formatCurrentDate()}</span>
      </div>
    </div>
  );
}
