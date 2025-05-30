import { Button as HeadlessButton } from "@headlessui/react";
import Link from "next/link";
import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ElementType,
  forwardRef,
  PropsWithChildren,
} from "react";

import cn from "@/utils/core/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: ElementType;
  };

const Button = forwardRef<HTMLButtonElement, PropsWithChildren<Props>>(
  ({ href, children, as, className, ...props }, ref) => {
    if (href) {
      return (
        <HeadlessButton
          ref={ref}
          as={Link}
          href={href}
          className={cn(
            "w-fit rounded-full bg-blue-700 px-[30px] py-2.5 text-sm font-bold uppercase tracking-wide text-gray-0 no-underline hover:bg-blue-600 dark:bg-blue-700 dark:text-gray-0 dark:hover:bg-blue-600",
            className
          )}
          {...props}
        >
          {children}
        </HeadlessButton>
      );
    }

    return (
      <HeadlessButton
        ref={ref}
        as={as}
        className={cn(
          "w-fit rounded-full bg-blue-700 px-[30px] py-2.5 text-sm font-bold uppercase tracking-wide text-gray-0 hover:bg-blue-600 dark:bg-blue-700 dark:text-gray-0 dark:hover:bg-blue-700",
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

export default Button;
