"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, Transition } from "@headlessui/react";
import classNames from "classnames";
import { FC, Fragment, PropsWithChildren, useState } from "react";

type Props = {
  variant: "light" | "dark";
  isOpen: boolean;
  label?: string;
  labelClassname?: string;
  onClose?: (isOpen: boolean) => void;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  variant,
  isOpen,
  label,
  labelClassname,
  onClose = () => {},
  children,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div
          className={classNames("fixed inset-0", {
            "bg-blue-900 bg-opacity-50": variant === "light",
            "bg-blue-100-dark/75": variant === "dark",
          })}
        />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center sm:p-4">
            <Dialog.Panel
              className={classNames(
                "static bottom-0 top-0 flex h-fit w-full max-w-fit  transform flex-col justify-between gap-6 overflow-y-scroll text-left align-middle shadow-xl transition-all",
                {
                  "rounded bg-gray-0 text-blue-900": variant === "light",
                  "border bg-blue-100-dark font-serif	text-gray-900-dark":
                    variant === "dark",
                }
              )}
            >
              <div className="flex flex-col p-7">
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
                    <div
                      className={classNames("absolute right-0 top-0", {
                        "px-3	py-2": variant === "light",
                        "p-1": variant === "dark",
                      })}
                    >
                      <button
                        onClick={() => onClose(false)}
                        className={classNames(
                          "border text-2xl text-blue-800 no-underline",
                          {
                            "h-[20px] w-[20px] border text-gray-600-dark":
                              variant === "dark",
                            "border-transparent hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30":
                              variant === "light",
                          }
                        )}
                      >
                        <FontAwesomeIcon
                          icon={faXmark}
                          size={variant === "dark" ? "xs" : undefined}
                          style={{
                            marginBottom:
                              variant === "dark" ? "5px" : undefined,
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-sm">{children}</div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default BaseModal;
