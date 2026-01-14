import { ComponentProps } from "react";

import cn from "@/utils/core/cn";

export function QuestionCardContainer({
  className,
  children,
  title,
  ...props
}: ComponentProps<"div"> & {
  title?: string;
}) {
  return (
    <div
      className={cn(
        "rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 lg:p-6",
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="my-0 w-full text-base font-medium leading-tight text-gray-800 dark:text-gray-800-dark">
          {title}
        </h3>
      )}
      <div className="mt-4 w-full">{children}</div>
    </div>
  );
}
