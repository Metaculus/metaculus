"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import classNames from "classnames";
import { FC, Fragment, PropsWithChildren } from "react";

type Props = {
  isOpen: boolean;
  label?: string;
  onClose?: (isOpen: boolean) => void;
  className?: string;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  isOpen,
  label,
  onClose = () => {},
  children,
  className,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-blue-900/50 dark:bg-gray-1000/50" />
        <div className="fixed inset-0 flex min-h-full justify-center overflow-y-auto sm:p-4">
          <DialogPanel
            className={classNames(
              "my-auto h-fit w-full max-w-fit transform overflow-y-scroll rounded bg-gray-0 p-7 text-left align-middle text-sm text-blue-900 shadow-xl transition-all dark:bg-gray-0-dark dark:text-blue-900-dark",
              className
            )}
          >
            {label && (
              <h2 className="mb-4 mt-0 text-gray-900 dark:text-gray-900-dark">
                {label}
              </h2>
            )}
            <button
              onClick={() => onClose(false)}
              className="absolute right-0 top-0 px-3 py-2 text-2xl text-blue-800 no-underline hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            {children}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default BaseModal;
