"use client";

import { faXTwitter } from "@fortawesome/free-brands-svg-icons";
import {
  faEllipsis,
  faArrowUpRightFromSquare,
  faFileImage,
  faFileCsv,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toPng } from "html-to-image";
import { ComponentProps, useCallback, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { MetaculusTextLogo } from "@/app/(main)/components/MetaculusTextLogo";
import DataRequestModal from "@/app/(main)/questions/[id]/components/download_question_data_modal";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import cn from "@/utils/core/cn";

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

function MoreButton({
  postIds,
  postTitle,
  onExportPng,
}: {
  postIds: number[];
  postTitle?: string;
  onExportPng?: () => void;
}) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

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

  // Copy question URL to clipboard (only for single post)
  const copyQuestionUrl = useCallback(() => {
    if (questionUrl) {
      navigator.clipboard
        .writeText(questionUrl)
        .then(() => {
          toast("URL is now copied to your clipboard", {
            className: "dark:bg-blue-700-dark dark:text-gray-0-dark",
          });
        })
        .catch((err) => console.error("Error copying link: ", err));
    }
  }, [questionUrl]);

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
                onClick={() => setIsDownloadModalOpen(true)}
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
    // Copy link only for single post
    ...(questionUrl
      ? [
          {
            id: "copy-link",
            name: "Copy Link",
            element: (
              <MenuItemWithIcon
                label="Copy Link"
                icon={faCopy}
                onClick={copyQuestionUrl}
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
          className="border-transparent bg-transparent text-blue-700 hover:!bg-blue-400 group-hover:bg-blue-200 data-[open]:!bg-blue-700 data-[open]:!text-gray-0 dark:text-blue-700-dark dark:hover:!bg-blue-400-dark dark:group-hover:bg-blue-200-dark dark:data-[open]:!bg-blue-700-dark dark:data-[open]:!text-gray-0-dark"
        >
          <FontAwesomeIcon icon={faEllipsis} />
        </Button>
      </DropdownMenu>
      <DataRequestModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        postId={postIds.length === 1 ? (postIds[0] as number) : postIds}
        title={postTitle}
      />
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
          variant === "primary" ? "h-7 w-3/4" : "h-5 w-2/3",
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
  variant = "secondary",
  showMoreButton = true,
  postIds = [],
  ...props
}: ComponentProps<"div"> & {
  title?: string;
  subtitle?: string;
  variant?: "secondary" | "primary";
  showMoreButton?: boolean;
  /** Post IDs for actions (view, export, share) */
  postIds?: number[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);

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
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${title ? title.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "-") : "question-card"}.png`;
        link.href = dataUrl;
        link.click();
        toast("Image downloaded successfully", {
          className: "dark:bg-blue-700-dark dark:text-gray-0-dark",
        });
      })
      .catch((err) => {
        console.error("Error exporting image:", err);
        toast.error("Failed to export image");
      })
      .finally(() => {
        // Clean up CSS variables after toPng completes
        node.style.removeProperty("--ss-visible");
        node.style.removeProperty("--ss-hidden");
      });
  }, [title]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative",
        variant === "primary" &&
          "rounded-md bg-gray-0 p-5 dark:bg-gray-0-dark lg:p-8",
        variant === "secondary" &&
          "rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 lg:p-6",
        className
      )}
      {...props}
    >
      {showMoreButton && postIds.length > 0 && (
        <div className="absolute right-4 top-4 z-10 [visibility:var(--ss-hidden,visible)] lg:right-5 lg:top-5">
          <MoreButton
            postIds={postIds}
            postTitle={title}
            onExportPng={handleExportPng}
          />
        </div>
      )}
      {title && (
        <h3
          className={cn(
            "my-0 w-full font-[450] leading-tight [text-wrap:pretty]",
            variant === "primary" &&
              "pr-12 text-2xl text-blue-800 dark:text-blue-800-dark",
            variant === "secondary" &&
              "pr-8 text-base text-gray-800 dark:text-gray-800-dark"
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
              "text-sm text-gray-600 dark:text-gray-600-dark"
          )}
        >
          {subtitle}
        </p>
      )}
      <div className="mt-4 w-full">{children}</div>

      {/* Footer with Metaculus attribution */}
      <div className="-mb-4 mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-500 [visibility:var(--ss-visible,hidden)] dark:text-gray-500-dark">
        <span>Data from</span>
        <MetaculusTextLogo className="h-3 w-auto" />
        <span>on {formatCurrentDate()}</span>
      </div>
    </div>
  );
}
