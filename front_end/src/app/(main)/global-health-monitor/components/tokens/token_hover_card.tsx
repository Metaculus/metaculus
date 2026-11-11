"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { useTranslations } from "next-intl";
import { MouseEvent, PointerEvent, ReactNode, useState } from "react";

import cn from "@/utils/core/cn";

type Props = {
  children: ReactNode;
  content: ReactNode;
  href?: string;
  external?: boolean;
  className?: string;
  onActiveChange?: (active: boolean) => void;
  dataAttributes?: Record<string, string | number | undefined>;
};

/**
 * Inline hover card for tokens inside prose. Unlike components/ui/tooltip it renders a
 * <span>/<a> trigger, so it is valid inside <p>. On touch, the first tap opens the card
 * and the second follows the link.
 */
export function TokenHoverCard({
  children,
  content,
  href,
  external = false,
  className,
  onActiveChange,
  dataAttributes,
}: Props) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onActiveChange?.(open);
  };

  const {
    refs: { setReference, setFloating },
    floatingStyles,
    context,
  } = useFloating({
    open: isOpen,
    onOpenChange: handleOpenChange,
    placement: "top",
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip({ padding: 12 }), shift({ padding: 12 })],
  });
  const hover = useHover(context, {
    delay: { open: 120, close: 80 },
    handleClose: safePolygon(),
    mouseOnly: true,
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const referenceProps = getReferenceProps({
    onPointerDown: (event: PointerEvent) => {
      setIsTouch(event.pointerType === "touch");
    },
    onClick: (event: MouseEvent) => {
      if (isTouch && !isOpen) {
        event.preventDefault();
        handleOpenChange(true);
      }
    },
  });

  return (
    <>
      {href ? (
        <a
          ref={setReference}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className={className}
          {...referenceProps}
          {...dataAttributes}
        >
          {children}
        </a>
      ) : (
        <span
          ref={setReference}
          tabIndex={0}
          className={className}
          {...referenceProps}
          {...dataAttributes}
        >
          {children}
        </span>
      )}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={setFloating}
            style={floatingStyles}
            className="z-[200] w-max max-w-[min(320px,calc(100vw-24px))] rounded-md border border-blue-400 bg-gray-0 px-4 py-3 text-sm leading-snug text-gray-800 shadow-lg dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-gray-800-dark print:hidden"
            {...getFloatingProps()}
          >
            {content}
            {isTouch && href && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500-dark">
                {t("globalHealthMonitorTapAgain")}
              </div>
            )}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export const tokenBaseClassName = cn(
  "rounded-sm underline decoration-1 underline-offset-[3px] transition-colors",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
);
