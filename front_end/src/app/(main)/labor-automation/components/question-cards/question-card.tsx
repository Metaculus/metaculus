import { ComponentProps } from "react";

import cn from "@/utils/core/cn";

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
  ...props
}: ComponentProps<"div"> & {
  title?: string;
  subtitle?: string;
  variant?: "secondary" | "primary";
}) {
  return (
    <div
      className={cn(
        "relative",
        variant === "primary" &&
          "rounded-md bg-gray-0 p-5 dark:bg-gray-0-dark lg:p-8",
        variant === "secondary" &&
          "rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 lg:p-6",
        className
      )}
      {...props}
    >
      {title && (
        <h3
          className={cn(
            "my-0 w-full font-[450] leading-tight [text-wrap:pretty]",
            variant === "primary" &&
              "text-2xl text-blue-800 dark:text-blue-800-dark",
            variant === "secondary" &&
              "text-base text-gray-800 dark:text-gray-800-dark"
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
