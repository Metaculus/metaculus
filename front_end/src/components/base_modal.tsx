"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, Transition } from "@headlessui/react";
import classNames from "classnames";
import { FC, Fragment, PropsWithChildren } from "react";

type Props = {
  isOpen: boolean;
  label?: string;
  labelClassname?: string;
  onClose?: (isOpen: boolean) => void;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  isOpen,
  label,
  labelClassname,
  onClose = () => {},
  children,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-metac-blue-900 bg-opacity-50" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center sm:p-4">
            <Dialog.Panel className="static bottom-0 top-0 flex h-fit w-full max-w-sm transform flex-col justify-between gap-6 overflow-y-scroll rounded bg-metac-gray-0 text-left align-middle text-metac-blue-900 shadow-xl transition-all dark:bg-metac-gray-0-dark dark:text-white">
              <div className="flex flex-col gap-6 p-7">
                <div className="flex justify-between">
                  {!!label && (
                    <h4
                      className={classNames(
                        labelClassname ??
                          "text-dark-theme-gray self-center text-sm leading-[14px]"
                      )}
                    >
                      {label}
                    </h4>
                  )}
                  <div className="flex grow justify-end">
                    <button
                      onClick={() => onClose(false)}
                      className="absolute right-0 top-0 inline-flex h-12 w-12 items-center justify-center rounded-full border border-transparent text-2xl text-metac-blue-800 no-underline hover:text-metac-blue-900 active:text-metac-blue-700 disabled:text-metac-blue-800 disabled:opacity-30 dark:text-metac-blue-800-dark dark:hover:text-metac-blue-900-dark dark:active:text-metac-blue-700-dark disabled:dark:text-metac-blue-800-dark"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                </div>
                <div>{children}</div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default BaseModal;
