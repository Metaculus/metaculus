import { faXmarkCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@headlessui/react";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

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
  label?: string;
  xMark?: boolean;
  onXMarkClick?: () => void;
};

const Chip: FC<PropsWithChildren<Props>> = ({
  variant = "filled",
  size = "sm",
  color = "gray",
  href,
  onClick,
  className,
  label,
  children,
  xMark = false,
  onXMarkClick = undefined,
}) => {
  return (
    <div
      className={cn(
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        href={href!}
        onClick={onClick}
        className={cn(
          "inline-flex items-center justify-center rounded-l border-inherit font-medium no-underline",
          {
            "rounded-r": xMark === false,
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
        {label && (
          <div
            className={cn(
              "flex items-center justify-center rounded-sm px-1 pb-0.5 pt-1",
              {
                "bg-orange-600 text-gray-0 dark:bg-orange-600-dark dark:text-gray-0-dark":
                  color === "orange",
                "bg-purple-600 text-gray-0 dark:bg-purple-600-dark dark:text-gray-0-dark":
                  color === "purple",
                "bg-gray-600 text-gray-0 dark:bg-gray-600-dark dark:text-gray-0-dark":
                  color === "gray" || color == "grayBold",
                "bg-blue-600 text-gray-0 dark:bg-blue-600-dark dark:text-gray-0-dark":
                  color === "blue" || color === "blueBold",
                "bg-olive-700 text-gray-0 dark:bg-olive-700-dark dark:text-gray-0-dark":
                  color === "olive",
                "bg-olive-900 text-gray-0 dark:bg-olive-900-dark dark:text-gray-0-dark":
                  color === "oliveBold",
              }
            )}
          >
            {label}
          </div>
        )}
      </Button>

      {xMark && (
        <Button
          className="flex items-center justify-center rounded-r bg-blue-400 p-1.5 text-blue-800 hover:bg-blue-500 dark:bg-blue-400-dark dark:text-blue-800-dark hover:dark:bg-blue-500-dark"
          onClick={onXMarkClick}
        >
          <FontAwesomeIcon icon={faXmarkCircle} />
        </Button>
      )}
    </div>
  );
};

export default Chip;
