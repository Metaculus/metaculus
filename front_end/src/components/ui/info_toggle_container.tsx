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
        "flex flex-col gap-2.5 rounded-lg border border-gray-300 p-4 transition-colors duration-300",
        showInfo
          ? "bg-blue-400 dark:bg-blue-400-dark"
          : "bg-gray-0 dark:bg-gray-0-dark",
        className
      )}
    >
      {/* Header with animated title */}
      <div className="flex items-center justify-between">
        <div className="relative mr-4 flex-1">
          {/* Main title - fades out and slides right */}
          <Transition
            show={!showInfo}
            enter="transition-all duration-300"
            enterFrom="opacity-0 -translate-x-8"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-300 absolute"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 translate-x-8"
            as="h3"
            className="text-xl font-semibold text-gray-900 dark:text-gray-900-dark"
          >
            {title}
          </Transition>

          {/* Info title - fades in and slides from left */}
          <Transition
            show={showInfo}
            enter="transition-all duration-300"
            enterFrom="opacity-0 -translate-x-8"
            enterTo="opacity-100 translate-x-0"
            leave="transition-all duration-300 absolute"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 translate-x-8"
            as="h3"
            className="inset-0 text-xl font-semibold text-blue-600 dark:text-blue-600-dark"
          >
            {infoTitle}
          </Transition>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex-shrink-0 transition-colors duration-200 hover:opacity-70"
          aria-label="Toggle info"
        >
          <FontAwesomeIcon
            icon={faCircleInfo}
            className={cn("text-base transition-colors duration-300", {
              "text-blue-500 dark:text-blue-500-dark": showInfo,
              "text-gray-400 dark:text-gray-400-dark": !showInfo,
            })}
          />
        </button>
      </div>

      {/* Content container with overlaid absolute positioning */}
      <div className="relative">
        {/* Children content - no enter animation, fade out on leave */}
        <Transition
          show={!showInfo}
          enter=""
          enterFrom=""
          enterTo=""
          leave="transition-opacity duration-300 absolute w-full top-0"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          as="div"
        >
          {children}
        </Transition>

        {/* Info content - fade in on enter */}
        <Transition
          show={showInfo}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300 absolute w-full top-0"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          as="div"
        >
          {infoContent}
        </Transition>
      </div>
    </div>
  );
};

export default InfoToggleContainer;
