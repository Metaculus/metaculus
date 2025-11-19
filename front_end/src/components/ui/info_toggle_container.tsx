import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Transition } from "@headlessui/react";
import { ReactNode, useState } from "react";

import cn from "@/utils/core/cn";

interface InfoToggleContainerProps {
  title: string;
  children: ReactNode;
  infoTitle: ReactNode;
  infoContent: ReactNode;
  className?: string;
}

export const InfoToggleContainer = ({
  title,
  children,
  infoTitle,
  infoContent,
  className,
}: InfoToggleContainerProps) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className={cn(
        "group flex cursor-pointer flex-col gap-2.5 overflow-hidden rounded-lg px-4 py-3 transition-colors duration-300",
        showInfo
          ? "bg-blue-400 dark:bg-blue-400-dark"
          : "bg-blue-200 dark:bg-blue-200-dark",
        className
      )}
      onClick={() => setShowInfo(!showInfo)}
    >
      <div className="flex items-center justify-between">
        <div className="relative mr-4 flex-1 text-lg font-medium text-blue-800 dark:text-blue-800-dark">
          <Transition
            show={!showInfo}
            enter="transition-all duration-300"
            enterFrom="opacity-0 translate-x-8"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-300 absolute"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 translate-x-8"
            as="div"
          >
            {title}
          </Transition>

          <Transition
            show={showInfo}
            enter="transition-all duration-300"
            enterFrom="opacity-0 -translate-x-8"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-300 absolute"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 -translate-x-8"
            as="div"
            className="inset-0"
          >
            {infoTitle}
          </Transition>
        </div>

        <button
          className="flex-shrink-0 transition-colors duration-200"
          aria-label="Toggle info"
        >
          <FontAwesomeIcon
            icon={faCircleInfo}
            className={cn(
              "text-base transition-colors duration-300 group-hover:text-blue-700 group-hover:dark:text-blue-700-dark",
              {
                "text-blue-500 dark:text-blue-500-dark": !showInfo,
                "text-blue-700 dark:text-blue-700-dark": showInfo,
              }
            )}
          />
        </button>
      </div>

      <div className="relative">
        <Transition
          show={!showInfo}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300 absolute w-full top-0"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          as="div"
        >
          {children}
        </Transition>

        <Transition
          show={showInfo}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300 absolute w-full top-0"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          as="div"
          className="text-blue-800 dark:text-blue-800-dark"
        >
          {infoContent}
        </Transition>
      </div>
    </div>
  );
};

export default InfoToggleContainer;
