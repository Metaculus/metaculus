"use client";

import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ComponentProps } from "react";

import ImageWithFallback from "@/components/ui/image_with_fallback";
import cn from "@/utils/core/cn";

export function ActivityCard({
  avatar,
  date,
  username,
  subtitle,
  children,
  degradeIndex = 0,
  variant = "purple",
  link,
  highlighted = false,
  className,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  avatar?: string;
  date?: string;
  username?: string;
  subtitle?: string;
  children: React.ReactNode;
  degradeIndex?: number;
  variant?: "purple" | "mint";
  link?: string;
  highlighted?: boolean;
  className?: string;
  onMouseEnter?: ComponentProps<"div">["onMouseEnter"];
  onMouseLeave?: ComponentProps<"div">["onMouseLeave"];
  onClick?: ComponentProps<"div">["onClick"];
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      style={{ "--degrade-index": degradeIndex } as React.CSSProperties}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        variant === "purple" &&
          "border-purple-400 bg-purple-200 dark:border-purple-200-dark dark:bg-purple-100-dark",
        variant === "mint" &&
          "border-mint-500 bg-mint-200 dark:border-mint-300-dark dark:bg-mint-200-dark",
        highlighted &&
          variant === "purple" &&
          "border-purple-700 ring-2 ring-purple-700 dark:border-purple-700-dark dark:ring-purple-700-dark",
        highlighted &&
          variant === "mint" &&
          "border-mint-700 ring-2 ring-mint-700 dark:border-mint-700-dark dark:ring-mint-700-dark",
        isClickable &&
          "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        link && "pr-12",
        className,
        "relative break-inside-avoid rounded-lg border px-3.5 py-3 transition-[box-shadow,transform,border-color] [--tw-bg-opacity:max(0.2,1-var(--degrade-index)*0.2)] dark:[--tw-bg-opacity:max(0.2,1-var(--degrade-index)*0.2)]"
      )}
    >
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          aria-label="Open external link"
          className={cn(
            variant === "purple" &&
              "text-purple-700 hover:text-purple-800 dark:text-purple-700-dark dark:hover:text-purple-800-dark",
            variant === "mint" &&
              "text-mint-700 hover:text-mint-800 dark:text-mint-700-dark dark:hover:text-mint-800-dark",
            "absolute right-3.5 top-3 inline-flex size-5 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
          )}
        >
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-4" />
        </a>
      )}
      {(avatar || username || subtitle || date) && (
        <div className="mb-1 flex items-center gap-3">
          {avatar && (
            <div className="mt-0.5 size-10 shrink-0 overflow-hidden rounded-full">
              <ImageWithFallback
                src={avatar}
                alt={username ? `${username} avatar` : ""}
                width={40}
                height={40}
                className="size-full object-cover"
              />
            </div>
          )}
          {(username || subtitle || date) && (
            <div
              className={cn(
                variant === "purple" &&
                  "text-purple-700 dark:text-purple-700-dark",
                variant === "mint" && "text-mint-700 dark:text-mint-700-dark",
                "flex min-w-0 flex-1 items-start justify-between gap-2 text-xs"
              )}
            >
              {username && subtitle && (
                <div className="min-w-0">
                  {username && <div className="font-bold">{username}</div>}
                  {subtitle && (
                    <div className="font-medium opacity-80">{subtitle}</div>
                  )}
                </div>
              )}
              {date && <div className="shrink-0 font-medium">{date}</div>}
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          variant === "purple" && "text-purple-800 dark:text-purple-800-dark",
          variant === "mint" && "text-mint-800 dark:text-mint-800-dark",
          "text-xs leading-normal lg:text-sm"
        )}
      >
        {children}
      </div>
    </div>
  );
}
