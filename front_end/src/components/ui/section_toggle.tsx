"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/cn";

export type SectionVariant = "primary" | "light" | "gold" | "transparent";

type Props = {
  title?: string;
  defaultOpen?: boolean;
  className?: string;
  wrapperClassName?: string;
  variant?: SectionVariant;
  id?: string;
  detailElement?: React.ReactNode | null;
};

const SectionToggle: FC<PropsWithChildren<Props>> = ({
  id,
  variant = "primary",
  title,
  defaultOpen,
  className,
  wrapperClassName,
  children,
  detailElement,
}) => {
  return (
    <Disclosure
      defaultOpen={defaultOpen}
      as="div"
      id={id}
      className={wrapperClassName}
    >
      {({ open }) => (
        <div
          className={cn("rounded", {
            "bg-blue-200 dark:bg-blue-200-dark": variant === "primary",
            "bg-gray-0 dark:bg-gray-0-dark": variant === "light",
            "bg-gold-200 dark:bg-gold-200-dark": variant === "gold",
            "bg-transparent dark:bg-transparent": variant === "transparent",
            "bg-opacity-50": !open,
          })}
        >
          <DisclosureButton className="w-full">
            <div
              className={cn(
                "flex w-full items-center gap-2.5 p-3 text-base",
                className,
                {
                  // Default variant
                  ...(variant === "primary" && {
                    "hover:text-blue-700 hover:dark:text-blue-700-dark": true,
                    "text-blue-700 dark:text-blue-700-dark": open,
                    "text-blue-600 dark:text-blue-600-dark": !open,
                  }),

                  // Light variant
                  ...(variant === "light" && {
                    "hover:text-blue-700 hover:dark:text-blue-700-dark": true,
                    "text-blue-700 dark:text-blue-700-dark": open,
                    "text-blue-600 dark:text-blue-600-dark": !open,
                    "xs:px-4": true,
                  }),

                  // Golden variant
                  ...(variant === "gold" && {
                    "hover:text-gray-800 hover:dark:text-gray-800-dark": true,
                    "text-gray-800 dark:text-gray-800-dark": open,
                    "text-gray-600 dark:text-gray-600-dark": !open,
                  }),
                }
              )}
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                className={cn(
                  "h-4 duration-75 ease-linear",
                  open && "rotate-180",
                  {
                    "text-blue-500 dark:text-blue-500-dark": [
                      "primary",
                      "light",
                    ].includes(variant),
                  }
                )}
              />
              <span>{title}</span>

              {detailElement}
            </div>
          </DisclosureButton>
          <DisclosurePanel
            className={cn("p-3 pt-0", {
              "xs:px-4": variant === "light",
            })}
          >
            {children}
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
};

export default SectionToggle;
