import { Button } from "@headlessui/react";
import classNames from "classnames";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

export type ChipSize = "xs" | "sm" | "md";
export type ChipVariant = "filled" | "outlined" | "subtle";
export type ChipColor =
  | "orange"
  | "purple"
  | "gray"
  | "grayBold"
  | "blue"
  | "blueBold"
  | "olive"
  | "oliveBold";

type Props = {
  variant?: ChipVariant;
  size?: ChipSize;
  color?: ChipColor;
  className?: string;
  onClick?: () => void;
  href?: string;
};

const Chip: FC<PropsWithChildren<Props>> = ({
  variant = "filled",
  size = "sm",
  color = "gray",
  href,
  onClick,
  className,
  children,
}) => {
  return (
    <div
      className={classNames(
        "inline-flex cursor-pointer select-none items-stretch justify-center rounded",
        {
          border: variant === "outlined",
          "border-orange-500 dark:border-orange-500-dark": color === "orange",
          "border-purple-500 dark:border-purple-500-dark": color === "purple",
          "border-gray-500 dark:border-gray-500-dark": color === "gray",
          "border-gray-700 dark:border-gray-700-dark": color === "grayBold",
          "border-blue-500 dark:border-blue-500-dark": color === "blue",
          "border-blue-700 dark:border-blue-700-dark": color === "blueBold",
          "border-olive-500 dark:border-olive-500-dark": color === "olive",
          "border-olive-900 dark:border-olive-900-dark": color === "oliveBold",
        },
        className
      )}
    >
      <Button
        as={href ? Link : undefined}
        href={href!}
        onClick={onClick}
        className={classNames(
          "inline-flex items-center justify-center rounded-l rounded-r border-inherit font-medium no-underline",
          {
            "gap-1 p-1 text-xs leading-3": size === "xs",
            "gap-1 p-1.5 text-sm leading-4": size === "sm",
            "gap-1.5 p-1.5 text-base leading-5": size === "md",

            "text-orange-900 dark:text-orange-900-dark": color === "orange",
            "hover:text-orange-700 hover:dark:text-orange-700-dark":
              color === "orange" && variant === "outlined",
            "bg-orange-200 hover:bg-orange-300 dark:bg-orange-200-dark dark:hover:bg-orange-300-dark":
              color === "orange" && variant === "filled",
            "bg-orange-100 hover:bg-orange-200 dark:bg-orange-100-dark hover:dark:bg-orange-200-dark":
              color === "orange" && variant === "subtle",

            "text-purple-900 dark:text-purple-900-dark": color === "purple",
            "hover:text-purple-700 hover:dark:text-purple-700-dark":
              color === "purple" && variant === "outlined",
            "bg-purple-200 hover:bg-purple-300 dark:bg-purple-200-dark dark:hover:bg-purple-300-dark":
              color === "purple" && variant === "filled",
            "bg-purple-100 hover:bg-purple-200 dark:bg-purple-100-dark hover:dark:bg-purple-200-dark":
              color === "purple" && variant === "subtle",

            "text-gray-900 dark:text-gray-900-dark": color === "gray",
            "hover:text-gray-700 hover:dark:text-gray-700-dark":
              color === "gray" && variant === "outlined",
            "bg-gray-300 hover:bg-gray-400 dark:bg-gray-300-dark dark:hover:bg-gray-400-dark":
              color === "gray" && variant === "filled",
            "bg-gray-200 hover:bg-gray-300 dark:bg-gray-200-dark hover:dark:bg-gray-300-dark":
              color === "gray" && variant === "subtle",

            "text-gray-900 hover:text-gray-700 dark:text-gray-900-dark hover:dark:text-gray-700-dark":
              color === "grayBold" &&
              (variant === "subtle" || variant === "outlined"),
            "bg-gray-700 text-gray-0 hover:bg-gray-600 dark:bg-gray-800-dark dark:text-gray-0-dark dark:hover:bg-gray-700-dark":
              color === "grayBold" && variant === "filled",

            "text-blue-900 dark:text-blue-900-dark": color === "blue",
            "hover:text-blue-700 hover:dark:text-blue-700-dark":
              color === "blue" && variant === "outlined",
            "bg-blue-300 hover:bg-blue-400 dark:bg-blue-300-dark dark:hover:bg-blue-400-dark":
              color === "blue" && variant === "filled",
            "bg-blue-200 hover:bg-blue-300 dark:bg-blue-200-dark hover:dark:bg-blue-300-dark":
              color === "blue" && variant === "subtle",

            "text-blue-900 hover:text-blue-700 dark:text-blue-900-dark hover:dark:text-blue-700-dark":
              color === "blueBold" &&
              (variant === "subtle" || variant === "outlined"),
            "bg-blue-700 text-gray-0 hover:bg-blue-600 dark:bg-blue-700-dark dark:text-gray-0-dark dark:hover:bg-blue-600-dark":
              color === "blueBold" && variant === "filled",

            "text-olive-900 dark:text-olive-900-dark": color === "olive",
            "hover:text-olive-700 hover:dark:text-olive-700-dark":
              color === "olive" && variant === "outlined",
            "bg-olive-300 hover:bg-olive-400 dark:bg-olive-300-dark dark:hover:bg-olive-400-dark":
              color === "olive" &&
              (variant === "subtle" || variant === "filled"),

            "text-olive-900 hover:text-olive-700 dark:text-olive-900-dark hover:dark:text-olive-700-dark":
              color === "oliveBold" &&
              (variant === "subtle" || variant === "outlined"),
            "bg-olive-700 text-gray-0 hover:bg-olive-600 dark:bg-olive-700-dark dark:text-gray-0-dark dark:hover:bg-olive-600-dark":
              color === "oliveBold" && variant === "filled",
          }
        )}
      >
        {children}
      </Button>
    </div>
  );
};

export default Chip;
