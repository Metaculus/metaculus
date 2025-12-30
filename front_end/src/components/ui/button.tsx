import { Button as HeadlessButton } from "@headlessui/react";
import Link from "next/link";
import React, {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ElementType,
  forwardRef,
  PropsWithChildren,
} from "react";

import cn from "@/utils/core/cn";

type ButtonSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "text"
  | "link";
type PresentationType = "default" | "icon";

type Props = {
  disabled?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  presentationType?: PresentationType;
  as?: ElementType;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      size = "sm",
      variant = "secondary",
      presentationType = "default",
      href,
      className,
      children,
      as,
      ...props
    },
    ref
  ) => {
    return (
      <Container
        ref={ref}
        href={href}
        as={as}
        className={cn(
          "inline-flex items-center justify-center rounded-full disabled:opacity-30",
          {
            xxs: "gap-0 rounded-sm border border-blue-400 text-sm font-normal leading-none disabled:opacity-50 dark:border-blue-600/50",
            xs: "gap-1 text-xs font-normal leading-none",
            sm: "gap-2 text-sm font-medium leading-none",
            md: "gap-2 text-base font-medium leading-tight",
            lg: "gap-3 text-lg font-medium leading-7",
            xl: "gap-3 text-2xl font-medium leading-loose",
            "2xl": "gap-4 text-3xl font-medium leading-9",
          }[size],
          variant !== "link" &&
            getPresentationTypeStyles(presentationType, size),
          {
            primary:
              "border border-blue-900 bg-blue-900 text-gray-200 no-underline hover:border-blue-800 hover:bg-blue-800 active:border-gray-800 active:bg-gray-800 disabled:border-blue-900 disabled:bg-blue-900 dark:border-blue-900-dark dark:bg-blue-900-dark dark:text-gray-200-dark dark:hover:border-blue-800-dark dark:hover:bg-blue-800-dark dark:active:border-gray-800-dark dark:active:bg-gray-800-dark disabled:dark:border-blue-900-dark disabled:dark:bg-blue-900-dark",
            secondary:
              "border border-gray-900 bg-gray-0 text-gray-900 no-underline hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-0 dark:border-gray-900-dark dark:bg-gray-0-dark dark:text-gray-900-dark dark:hover:bg-gray-200-dark dark:active:bg-gray-300-dark disabled:dark:bg-gray-0-dark",
            tertiary:
              "border border-blue-500 bg-gray-0 text-blue-700 no-underline hover:border-blue-600 hover:bg-blue-100 active:border-blue-600 active:bg-blue-200 disabled:border-blue-500 disabled:bg-gray-0 dark:border-blue-500-dark dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:border-blue-600-dark dark:hover:bg-blue-100-dark dark:active:border-blue-600-dark dark:active:bg-blue-200-dark disabled:dark:border-blue-500-dark disabled:dark:bg-gray-0-dark",
            text: "border border-transparent text-blue-800 no-underline hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark disabled:dark:text-blue-800-dark",
            link: "text-blue-800 underline hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark disabled:dark:text-blue-800-dark",
          }[variant],
          className
        )}
        {...props}
      >
        {children}
      </Container>
    );
  }
);
Button.displayName = "Button";

type ContainerProps = ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: ElementType;
  };
const Container = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ContainerProps>
>(({ href, children, as, ...props }, ref) => {
  if (href) {
    return (
      <HeadlessButton ref={ref} as={Link} href={href} {...props}>
        {children}
      </HeadlessButton>
    );
  }

  return (
    <HeadlessButton ref={ref} as={as} {...props}>
      {children}
    </HeadlessButton>
  );
});
Container.displayName = "Container";

function getPresentationTypeStyles(type: PresentationType, size: ButtonSize) {
  switch (type) {
    case "icon":
      return {
        xxs: "h-6 w-6",
        xs: "h-6 w-6",
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
        xl: "h-12 w-12",
        "2xl": "h-16 w-16",
      }[size];
    default:
      return {
        xxs: "py-0 pl-0.5 pr-2",
        xs: "px-2 py-0.5",
        sm: "px-3 py-2",
        md: "px-4 py-2",
        lg: "px-5 py-2",
        xl: "px-6 py-2.5",
        "2xl": "px-7 py-3.5",
      }[size];
  }
}

export default Button;
