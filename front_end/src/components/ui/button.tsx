import { Button as HeadlessButton } from "@headlessui/react";
import classNames from "classnames";
import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef } from "react";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
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
      ...props
    },
    ref
  ) => {
    return (
      <HeadlessButton
        ref={ref}
        as={href ? Link : undefined}
        href={href ?? ""}
        className={classNames(
          "inline-flex items-center justify-center rounded-full disabled:opacity-30",
          {
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
              "border border-metac-blue-900 bg-metac-blue-900 text-metac-gray-200 no-underline hover:border-metac-blue-800 hover:bg-metac-blue-800 active:border-metac-gray-800 active:bg-metac-gray-800 disabled:border-metac-blue-900 disabled:bg-metac-blue-900 dark:border-metac-blue-900-dark dark:bg-metac-blue-900-dark dark:text-metac-gray-200-dark dark:hover:border-metac-blue-800-dark dark:hover:bg-metac-blue-800-dark dark:active:border-metac-gray-800-dark dark:active:bg-metac-gray-800-dark disabled:dark:border-metac-blue-900-dark disabled:dark:bg-metac-blue-900-dark",
            secondary:
              "border border-metac-gray-900 bg-metac-gray-0 text-metac-gray-900 no-underline hover:bg-metac-gray-200 active:bg-metac-gray-300 disabled:bg-metac-gray-0 dark:border-metac-gray-900-dark dark:bg-metac-gray-0-dark dark:text-metac-gray-900-dark dark:hover:bg-metac-gray-200-dark dark:active:bg-metac-gray-300-dark disabled:dark:bg-metac-gray-0-dark",
            tertiary:
              "border border-metac-blue-500 bg-metac-gray-0 text-metac-blue-700 no-underline hover:border-metac-blue-600 hover:bg-metac-blue-100 active:border-metac-blue-600 active:bg-metac-blue-200 disabled:border-metac-blue-500 disabled:bg-metac-gray-0 dark:border-metac-blue-500-dark dark:bg-metac-gray-0-dark dark:text-metac-blue-700-dark dark:hover:border-metac-blue-600-dark dark:hover:bg-metac-blue-100-dark dark:active:border-metac-blue-600-dark dark:active:bg-metac-blue-200-dark disabled:dark:border-metac-blue-500-dark disabled:dark:bg-metac-gray-0-dark",
            text: "border border-transparent text-metac-blue-800 no-underline hover:text-metac-blue-900 active:text-metac-blue-700 disabled:text-metac-blue-800 dark:text-metac-blue-800-dark dark:hover:text-metac-blue-900-dark dark:active:text-metac-blue-700-dark disabled:dark:text-metac-blue-800-dark",
            link: "text-metac-blue-800 underline hover:text-metac-blue-900 active:text-metac-blue-700 disabled:text-metac-blue-800 dark:text-metac-blue-800-dark dark:hover:text-metac-blue-900-dark dark:active:text-metac-blue-700-dark disabled:dark:text-metac-blue-800-dark",
          }[variant],
          className
        )}
        {...props}
      >
        {children}
      </HeadlessButton>
    );
  }
);
Button.displayName = "Button";

function getPresentationTypeStyles(type: PresentationType, size: ButtonSize) {
  switch (type) {
    case "icon":
      return {
        xs: "h-6 w-6",
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
        xl: "h-12 w-12",
        "2xl": "h-16 w-16",
      }[size];
    default:
      return {
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
