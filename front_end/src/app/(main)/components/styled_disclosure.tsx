import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
} from "@headlessui/react";
import React, { ReactNode } from "react";

interface StyledDisclosureProps {
  question: string;
  children: ReactNode;
}

const StyledDisclosure: React.FC<StyledDisclosureProps> = ({
  question,
  children,
}) => {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="w-full">
          <DisclosureButton
            className={`group flex w-full items-center gap-3 rounded p-3 text-left text-lg transition-all ${
              open
                ? "rounded-b-none bg-blue-500 dark:bg-blue-600"
                : "bg-white dark:bg-blue-900 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-800 md:dark:hover:bg-blue-700"
            }`}
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              size="sm"
              className={`text-blue-700 transition-transform ${
                open
                  ? "rotate-180 text-blue-800 dark:text-blue-400"
                  : "dark:text-blue-500"
              }`}
            />
            {question}
          </DisclosureButton>
          <Transition
            enter="transition-all duration-300 ease-in-out"
            enterFrom="max-h-0 opacity-0 overflow-hidden"
            enterTo="max-h-[1000px] opacity-100 overflow-hidden"
            leave="transition-all duration-400 ease-in-out"
            leaveFrom="max-h-[1000px] opacity-100 overflow-hidden"
            leaveTo="max-h-0 opacity-0 overflow-hidden"
          >
            <DisclosurePanel className="rounded-t-none border border-blue-500 px-3 py-0 text-gray-700 dark:border-blue-600 md:px-5">
              {children}
            </DisclosurePanel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};

export default StyledDisclosure;
