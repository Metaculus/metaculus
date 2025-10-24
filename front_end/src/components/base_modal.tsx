"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import { FC, Fragment, PropsWithChildren, useEffect } from "react";

import cn from "@/utils/core/cn";

type Props = {
  isOpen: boolean;
  label?: string;
  onClose?: (isOpen: boolean) => void;
  className?: string;
  dialogClassName?: string;
  closeButtonClassName?: string;
  isImmersive?: boolean;
  modalContentRef?: React.RefObject<HTMLDivElement | null>;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  isOpen,
  label,
  onClose = () => {},
  children,
  className,
  dialogClassName,
  closeButtonClassName,
  isImmersive = false,
  modalContentRef,
}) => {
  useEffect(() => {
    if (isOpen && isImmersive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isImmersive]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={cn("relative z-[201]", dialogClassName)}
        onClose={onClose}
        onWheel={(e) => isImmersive && e.stopPropagation()}
      >
        <div
          className={cn(
            "fixed inset-0",
            isImmersive
              ? "bg-blue-900/60 backdrop-blur-md dark:bg-gray-1000/60"
              : "bg-blue-900/50 dark:bg-gray-1000/50"
          )}
        />
        <div
          className={`fixed inset-0 flex min-h-full justify-center ${isImmersive ? "overflow-hidden" : "overflow-y-auto"} sm:p-4`}
        >
          <DialogPanel
            ref={modalContentRef}
            className={cn(
              "my-auto max-h-full w-full max-w-fit transform overflow-y-auto rounded bg-gray-0 p-5 text-left align-middle text-sm text-blue-900 shadow-xl transition-all dark:bg-gray-0-dark dark:text-blue-900-dark md:p-7",
              isImmersive ? "h-svh md:h-fit" : "",
              className
            )}
          >
            {label && (
              <h2 className="mb-4 mt-0 text-gray-900 dark:text-gray-900-dark">
                {label}
              </h2>
            )}
            {!isImmersive && (
              <button
                onClick={() => onClose(false)}
                className={cn(
                  "absolute right-0 top-0 px-3 py-2 text-xl text-blue-800 no-underline opacity-50 hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark",
                  closeButtonClassName
                )}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
            {children}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default BaseModal;
