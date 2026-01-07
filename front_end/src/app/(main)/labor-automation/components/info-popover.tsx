"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  Strategy,
} from "@floating-ui/react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode, useState } from "react";

import Button from "@/components/ui/button";

type Props = {
  children: ReactNode;
  buttonLabel?: string;
  floatingStrategy?: Strategy;
};

export default function InfoPopover({
  children,
  buttonLabel = "More information",
  floatingStrategy,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-end",
    strategy: floatingStrategy,
    whileElementsMounted: autoUpdate,
    middleware: [offset(12), flip({ padding: 12 }), shift({ padding: 12 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <Button
        ref={refs.setReference}
        presentationType="icon"
        size="md"
        variant={isOpen ? "primary" : "tertiary"}
        aria-label={buttonLabel}
        aria-pressed={isOpen}
        className="h-9 w-9 border border-blue-400 text-lg dark:border-blue-400-dark"
        {...getReferenceProps()}
      >
        ?
      </Button>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[100] w-[390px]"
          >
            <div className="relative rounded-[6px] bg-blue-400 p-5 pr-10 dark:bg-blue-400-dark">
              {children}
              <Button
                presentationType="icon"
                size="sm"
                variant="text"
                aria-label="Close"
                onClick={() => setIsOpen(false)}
                className="absolute right-2.5 top-2.5 text-lg text-blue-900 opacity-50 dark:text-blue-900-dark dark:opacity-50"
              >
                <FontAwesomeIcon icon={faXmark} />
              </Button>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
