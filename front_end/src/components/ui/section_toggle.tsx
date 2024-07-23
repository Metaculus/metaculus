"use client";
import { faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import classNames from "classnames";
import { FC, PropsWithChildren } from "react";

type Props = {
  title?: string;
  defaultOpen?: boolean;
  className?: string;
};

const SectionToggle: FC<PropsWithChildren<Props>> = ({
  title,
  defaultOpen,
  className,
  children,
}) => {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      <DisclosureButton
        className={classNames(
          "my-4 flex w-full items-center gap-2.5 bg-blue-200 p-1 text-sm leading-4 text-gray-900 dark:bg-blue-200-dark dark:text-gray-900-dark",
          className
        )}
      >
        {({ open }) => (
          <>
            <FontAwesomeIcon
              icon={faCaretRight}
              className={classNames(
                "ml-0.5 h-4 duration-75 ease-linear",
                open && "rotate-90"
              )}
            />
            {title}
          </>
        )}
      </DisclosureButton>
      <DisclosurePanel>{children}</DisclosurePanel>
    </Disclosure>
  );
};

export default SectionToggle;
