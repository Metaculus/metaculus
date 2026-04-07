import { ComponentProps } from "react";

import cn from "@/utils/core/cn";

import { MobileCarousel } from "./mobile-carousel";

export function SectionCard({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-md bg-gray-0 p-5 dark:bg-gray-0-dark md:p-10 print:px-0 print:py-4",
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
        "my-0 break-after-avoid text-lg font-medium tracking-tight text-blue-800 dark:text-blue-800-dark md:text-3xl md:font-bold print:text-2xl print:font-bold",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function DualPaneSectionCard({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <SectionCard
      className={cn(
        "grid grid-cols-1 gap-8 lg:grid-cols-2 print:grid-cols-2",
        className
      )}
      {...props}
    >
      {children}
    </SectionCard>
  );
}

export function DualPaneSectionLeft({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col space-y-4 self-start md:space-y-8 lg:sticky lg:top-36 print:static print:space-y-4 [&>*]:min-w-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DualPaneSectionRight({
  className,
  children,
  useMobileCarousel = true,
  ...props
}: ComponentProps<"div"> & { useMobileCarousel?: boolean }) {
  return (
    <>
      <div
        className={cn(
          useMobileCarousel ? "hidden lg:flex" : "flex",
          "min-w-0 flex-col space-y-6 print:flex print:space-y-4 [&>*]:min-w-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
      {useMobileCarousel && (
        <div className="-mx-5 md:-mx-10 lg:hidden print:hidden">
          <MobileCarousel>{children}</MobileCarousel>
        </div>
      )}
    </>
  );
}

export function ContentParagraph({
  className,
  children,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "my-0 break-inside-avoid text-base text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-lg",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}
