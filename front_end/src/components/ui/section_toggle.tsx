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

export type SectionVariant = "primary" | "light";

type Props = {
  title?: string;
  defaultOpen?: boolean;
  className?: string;
  variant?: SectionVariant;
};

const SectionToggle: FC<PropsWithChildren<Props>> = ({
  variant = "primary",
  title,
  defaultOpen,
  className,
  children,
}) => {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <div
          className={classNames("rounded", {
            "bg-blue-200 dark:bg-blue-200-dark": variant === "primary",
            "bg-gray-0 dark:bg-gray-0-dark": variant === "light",
            "bg-opacity-50": !open,
          })}
        >
          <DisclosureButton className="w-full">
            <div
              className={classNames(
                "flex w-full items-center gap-2.5 p-3 text-base hover:text-blue-700 hover:dark:text-blue-700-dark",
                className,
                {
                  "text-blue-700 dark:text-blue-700-dark": open,
                  "text-blue-600 dark:text-blue-600-dark": !open,
                  "xs:px-4": variant === "light",
                }
              )}
            >
              <FontAwesomeIcon
                icon={faChevronUp}
                className={classNames(
                  "h-4 text-blue-500 duration-75 ease-linear dark:text-blue-500-dark",
                  open && "rotate-180"
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
