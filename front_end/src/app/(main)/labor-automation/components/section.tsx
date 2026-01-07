import { ComponentProps } from "react";

import cn from "@/utils/core/cn";

export function SectionCard({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-md bg-gray-0 p-5 dark:bg-gray-0-dark md:p-10",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  className,
  children,
  ...props
}: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "mt-0 text-lg font-medium tracking-tight text-blue-800 dark:text-blue-800-dark md:text-3xl md:font-bold",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}
