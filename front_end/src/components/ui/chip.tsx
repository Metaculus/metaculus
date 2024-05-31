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
          "border-metac-orange-500 dark:border-metac-orange-500-dark":
            color === "orange",
          "border-metac-purple-500 dark:border-metac-purple-500-dark":
            color === "purple",
          "border-metac-gray-500 dark:border-metac-gray-500-dark":
            color === "gray",
          "border-metac-gray-700 dark:border-metac-gray-700-dark":
            color === "grayBold",
          "border-metac-blue-500 dark:border-metac-blue-500-dark":
            color === "blue",
          "border-metac-blue-700 dark:border-metac-blue-700-dark":
            color === "blueBold",
          "border-metac-olive-500 dark:border-metac-olive-500-dark":
            color === "olive",
          "border-metac-olive-900 dark:border-metac-olive-900-dark":
            color === "oliveBold",
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

            "text-metac-orange-900 dark:text-metac-orange-900-dark":
              color === "orange",
            "hover:text-metac-orange-700 hover:dark:text-metac-orange-700-dark":
              color === "orange" && variant === "outlined",
            "bg-metac-orange-200 hover:bg-metac-orange-300 dark:bg-metac-orange-200-dark dark:hover:bg-metac-orange-300-dark":
              color === "orange" && variant === "filled",
            "bg-metac-orange-100 hover:bg-metac-orange-200 dark:bg-metac-orange-100-dark hover:dark:bg-metac-orange-200-dark":
              color === "orange" && variant === "subtle",

            "text-metac-purple-900 dark:text-metac-purple-900-dark":
              color === "purple",
            "hover:text-metac-purple-700 hover:dark:text-metac-purple-700-dark":
              color === "purple" && variant === "outlined",
            "bg-metac-purple-200 hover:bg-metac-purple-300 dark:bg-metac-purple-200-dark dark:hover:bg-metac-purple-300-dark":
              color === "purple" && variant === "filled",
            "bg-metac-purple-100 hover:bg-metac-purple-200 dark:bg-metac-purple-100-dark hover:dark:bg-metac-purple-200-dark":
              color === "purple" && variant === "subtle",

            "text-metac-gray-900 dark:text-metac-gray-900-dark":
              color === "gray",
            "hover:text-metac-gray-700 hover:dark:text-metac-gray-700-dark":
              color === "gray" && variant === "outlined",
            "bg-metac-gray-300 hover:bg-metac-gray-400 dark:bg-metac-gray-300-dark dark:hover:bg-metac-gray-400-dark":
              color === "gray" && variant === "filled",
            "bg-metac-gray-200 hover:bg-metac-gray-300 dark:bg-metac-gray-200-dark hover:dark:bg-metac-gray-300-dark":
              color === "gray" && variant === "subtle",

            "text-metac-gray-900 hover:text-metac-gray-700 dark:text-metac-gray-900-dark hover:dark:text-metac-gray-700-dark":
              color === "grayBold" &&
              (variant === "subtle" || variant === "outlined"),
            "bg-metac-gray-700 text-metac-gray-0 hover:bg-metac-gray-600 dark:bg-metac-gray-800-dark dark:text-metac-gray-0-dark dark:hover:bg-metac-gray-700-dark":
              color === "grayBold" && variant === "filled",

            "text-metac-blue-900 dark:text-metac-blue-900-dark":
              color === "blue",
            "hover:text-metac-blue-700 hover:dark:text-metac-blue-700-dark":
              color === "blue" && variant === "outlined",
            "bg-metac-blue-300 hover:bg-metac-blue-400 dark:bg-metac-blue-300-dark dark:hover:bg-metac-blue-400-dark":
              color === "blue" && variant === "filled",
            "bg-metac-blue-200 hover:bg-metac-blue-300 dark:bg-metac-blue-200-dark hover:dark:bg-metac-blue-300-dark":
              color === "blue" && variant === "subtle",

            "text-metac-blue-900 hover:text-metac-blue-700 dark:text-metac-blue-900-dark hover:dark:text-metac-blue-700-dark":
              color === "blueBold" &&
              (variant === "subtle" || variant === "outlined"),
            "bg-metac-blue-700 text-metac-gray-0 hover:bg-metac-blue-600 dark:bg-metac-blue-700-dark dark:text-metac-gray-0-dark dark:hover:bg-metac-blue-600-dark":
              color === "blueBold" && variant === "filled",

            "text-metac-olive-900 dark:text-metac-olive-900-dark":
              color === "olive",
            "hover:text-metac-olive-700 hover:dark:text-metac-olive-700-dark":
              color === "olive" && variant === "outlined",
            "bg-metac-olive-300 hover:bg-metac-olive-400 dark:bg-metac-olive-300-dark dark:hover:bg-metac-olive-400-dark":
              color === "olive" &&
              (variant === "subtle" || variant === "filled"),

            "text-metac-olive-900 hover:text-metac-olive-700 dark:text-metac-olive-900-dark hover:dark:text-metac-olive-700-dark":
              color === "oliveBold" &&
              (variant === "subtle" || variant === "outlined"),
            "bg-metac-olive-700 text-metac-gray-0 hover:bg-metac-olive-600 dark:bg-metac-olive-700-dark dark:text-metac-gray-0-dark dark:hover:bg-metac-olive-600-dark":
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
