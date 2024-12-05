"use client";

import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import classNames from "classnames";
import { FC, PropsWithChildren } from "react";

export type SectionVariant = "primary" | "light" | "gold";

type Props = {
  title?: string;
  defaultOpen?: boolean;
  className?: string;
  variant?: SectionVariant;
  id?: string;
};

const SectionToggle: FC<PropsWithChildren<Props>> = ({
  id,
  variant = "primary",
  title,
  defaultOpen,
  className,
  children,
}) => {
  return (
    <Disclosure defaultOpen={defaultOpen} as="div" id={id}>
      {({ open }) => (
        <div
          className={classNames("rounded", {
            "bg-blue-200 dark:bg-blue-200-dark": variant === "primary",
            "bg-gray-0 dark:bg-gray-0-dark": variant === "light",
            "bg-gold-200 dark:bg-gold-200-dark": variant === "gold",
            "bg-opacity-50": !open,
          })}
        >
          <DisclosureButton className="w-full">
            <div
              className={classNames(
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
                icon={faChevronUp}
                className={classNames(
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
            </div>
          </DisclosureButton>
          <DisclosurePanel
            className={classNames("p-3 pt-0", {
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
