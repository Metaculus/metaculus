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
import { ComponentProps, useState } from "react";

import DataRequestModal from "@/app/(main)/questions/[id]/components/download_question_data_modal";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import cn from "@/utils/core/cn";

const dropdownItemClassName =
  "flex w-full items-center justify-end gap-2 whitespace-nowrap border-b border-blue-400 px-4 py-1.5 text-sm text-blue-800 hover:bg-blue-100 last:border-b-0 dark:border-blue-400-dark dark:text-blue-800-dark dark:hover:bg-blue-100-dark";

function MoreButton({
  postId,
  postTitle,
}: {
  postId?: number;
  postTitle?: string;
}) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const moreMenuItems: MenuItemProps[] = [
    {
      id: "view-question",
      name: "View Question",
      element: (
        <button className={dropdownItemClassName}>
          <span>View Question</span>
          <FontAwesomeIcon
            icon={faArrowUpRightFromSquare}
            className="w-4 text-blue-700/50 dark:text-blue-700-dark/50"
          />
        </button>
      ),
      link: postId ? `/questions/${postId}` : undefined,
    },
    {
      id: "export-png",
      name: "Export PNG",
      element: (
        <button className={dropdownItemClassName}>
          <span>Export PNG</span>
          <FontAwesomeIcon
            icon={faFileImage}
            className="w-4 text-blue-700/50 dark:text-blue-700-dark/50"
          />
        </button>
      ),
    },
    ...(postId
      ? [
          {
            id: "export-csv",
            name: "Export CSV",
            element: (
              <button
                className={dropdownItemClassName}
                onClick={() => setIsDownloadModalOpen(true)}
              >
                <span>Export CSV</span>
                <FontAwesomeIcon
                  icon={faFileCsv}
                  className="w-4 text-blue-700/50 dark:text-blue-700-dark/50"
                />
              </button>
            ),
          },
        ]
      : []),
    {
      id: "share-twitter",
      name: "Share on",
      element: (
        <button className={dropdownItemClassName}>
          <span>Share on</span>
          <FontAwesomeIcon
            icon={faXTwitter}
            className="w-4 text-blue-700/50 dark:text-blue-700-dark/50"
          />
        </button>
      ),
    },
    {
      id: "copy-link",
      name: "Copy Link",
      element: (
        <button className={dropdownItemClassName}>
          <span>Copy Link</span>
          <FontAwesomeIcon
            icon={faCopy}
            className="w-4 text-blue-700/50 dark:text-blue-700-dark/50"
          />
        </button>
      ),
    },
  ];

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
      {postId && (
        <DataRequestModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          postId={postId}
          title={postTitle}
        />
      )}
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
  postId,
  ...props
}: ComponentProps<"div"> & {
  title?: string;
  subtitle?: string;
  variant?: "secondary" | "primary";
  showMoreButton?: boolean;
  postId?: number;
}) {
  return (
    <div
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
      {showMoreButton && (
        <div className="absolute right-4 top-4 z-10 lg:right-5 lg:top-5">
          <MoreButton postId={postId} postTitle={title} />
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
    </div>
  );
}
