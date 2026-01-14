import { ComponentProps } from "react";

import cn from "@/utils/core/cn";

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
