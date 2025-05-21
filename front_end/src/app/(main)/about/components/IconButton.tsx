import { forwardRef } from "react";

import cn from "@/utils/core/cn";

import { ButtonSize, ButtonVariant, buttonVariantClassName } from "./Button";

interface IconButtonProps extends React.PropsWithChildren {
  "aria-label": string;
  disabled?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
}

const IconButton = forwardRef(function IconButton(
  {
    size = "sm",
    children,
    className,
    variant = "secondary",
    href,
    ...props
  }: IconButtonProps &
    React.ButtonHTMLAttributes<HTMLButtonElement> &
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
  ref: React.Ref<HTMLButtonElement & HTMLAnchorElement>
) {
  const Element = href ? "a" : "button";

  return (
    <Element
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full disabled:opacity-30",
        {
          xs: "text-xs",
          sm: "text-sm",
          md: "text-base",
          lg: "text-lg",
          xl: "text-2xl",
          "2xl": "text-3xl",
        }[size],
        variant !== "link" &&
          {
            xs: "h-6 w-6",
            sm: "h-6 w-6",
            md: "h-8 w-8",
            lg: "h-10 w-10",
            xl: "h-12 w-12",
            "2xl": "h-16 w-16",
          }[size],
        buttonVariantClassName(variant),
        className
      )}
      href={href}
      {...props}
    >
      {children}
    </Element>
  );
});

export default IconButton;
