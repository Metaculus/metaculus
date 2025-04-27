"use client";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { FC, Fragment, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = {
  title: string;
};

const InfoToggle: FC<PropsWithChildren<Props>> = ({ title, children }) => {
  return (
    <Disclosure as={Fragment}>
      {({ open }) => (
        <div
          className={cn(
            "relative border-t border-gray-300 py-4 dark:border-gray-300-dark"
          )}
        >
          <DisclosureButton className="flex w-full pl-5">
            <legend className="px-1 text-sm leading-4 text-gray-600 dark:text-gray-600-dark">
              <svg
                viewBox="-6 -6 12 12"
                width="1em"
                height="1em"
                className={cn(
                  "disclosure-cross mr-1 inline-block align-[-3px] transition-transform duration-200",
                  {
                    "rotate-90": open,
                  }
                )}
              >
                <circle r="5.5" className="fill-none stroke-current stroke-1" />
                <line
                  x1="-4"
                  x2="4"
                  y1="0"
                  y2="0"
                  className={cn(
                    "fill-none stroke-current stroke-1 transition-opacity duration-200",
                    { "opacity-0": open }
                  )}
                />
                <line
                  y1="-4"
                  y2="4"
                  x1="0"
                  x2="0"
                  className="fill-none stroke-current stroke-1"
                />
              </svg>
              {title}
            </legend>
          </DisclosureButton>

          <DisclosurePanel className="px-3 py-4">{children}</DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
};

export default InfoToggle;
