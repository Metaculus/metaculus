"use client";

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { faBell, faFilePdf } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading_spiner";
import cn from "@/utils/core/cn";

import { NewsletterSubscribePopover } from "./newsletter_subscribe_popover";
import { ScrollspyButtonGroup } from "./scrollspy_button_group";

export default function LaborHubNavigation({
  sections,
  newsletterListKey,
}: {
  sections: { id: string; label: string }[];
  newsletterListKey?: string;
}) {
  const [isSticky, setIsSticky] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open: isNewsletterOpen,
    onOpenChange: setIsNewsletterOpen,
    placement: "bottom-end",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      flip({ padding: 12 }),
      shift({
        padding: {
          top: 60,
          left: 12,
          right: 12,
          bottom: 12,
        },
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);
  const setReference = useCallback(
    (node: HTMLButtonElement | null) => {
      refs.setReference(node);
    },
    [refs]
  );
  const setFloating = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node);
    },
    [refs]
  );
  const handlePdfDownload = useCallback(async () => {
    if (isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const response = await fetch("/labor-hub/pdf/");

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        let errorMessage = "Failed to generate the Labor Hub PDF.";

        if (contentType.includes("application/json")) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          errorMessage = data?.error || errorMessage;
        } else {
          const text = await response.text().catch(() => "");
          errorMessage = text || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const pdfBlob = await response.blob();
      const objectUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");

      downloadLink.href = objectUrl;
      downloadLink.download = "labor-automation-hub.pdf";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to download Labor Hub PDF", error);
      toast.error("Failed to download the PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [isDownloadingPdf]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsSticky(!entry.isIntersecting);
        }
      },
      {
        threshold: [0],
        rootMargin: "-48px 0px 0px 0px", // Account for top-12 offset (48px)
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  const surfaceClassName = "bg-gray-0 dark:bg-gray-0-dark";
  const fadeToSurfaceClassName = "to-gray-0 dark:to-gray-0-dark";
  const tabEndSpacingClassName =
    "after:w-28 sm:after:w-32 md:after:w-36 lg:after:w-40";
  const actionRailClassName =
    "pointer-events-auto absolute inset-y-0 right-0 flex items-center pr-4 gap-2 sm:pr-6 md:pr-8";
  const actionFadeClassName =
    "absolute inset-y-0 right-full w-8 bg-gradient-to-r from-transparent sm:w-12";

  return (
    <>
      <div ref={sentinelRef} className="h-0" />
      <div className="pointer-events-none sticky top-12 z-[100] mx-auto w-full max-w-7xl pb-4 transition-all sm:pb-8 xl:px-16 print:hidden">
        <div
          className={cn(
            "border border-t-0 backdrop-blur-sm transition-[margin,padding] xl:rounded-b-md",
            isSticky
              ? "mb-7 border-blue-500 border-x-transparent bg-gray-0/90 py-3 dark:border-blue-500-dark dark:border-x-transparent dark:bg-gray-0-dark/90  sm:mb-10 md:mb-12 md:py-4 xl:border-x-blue-500 dark:xl:border-x-blue-500-dark"
              : "border-gray-0 bg-gray-0 py-5 dark:border-gray-0-dark dark:bg-gray-0-dark sm:py-8 md:py-10"
          )}
        >
          <div className="relative">
            <div className="pointer-events-auto w-full overflow-x-auto no-scrollbar">
              <div
                className={cn(
                  "flex w-max before:w-4 before:shrink-0 before:content-[''] after:shrink-0 after:content-[''] sm:before:w-8",
                  tabEndSpacingClassName
                )}
              >
                <ScrollspyButtonGroup items={sections} />
              </div>
            </div>

            <div className={cn(actionRailClassName, surfaceClassName)}>
              <div
                aria-hidden
                className={cn(actionFadeClassName, fadeToSurfaceClassName)}
              />
              <Button
                type="button"
                variant="tertiary"
                size="md"
                presentationType="icon"
                aria-label={
                  isDownloadingPdf ? "Downloading PDF" : "Download PDF"
                }
                aria-busy={isDownloadingPdf}
                disabled={isDownloadingPdf}
                onClick={handlePdfDownload}
                className={cn(
                  "relative z-10 border-purple-700 bg-transparent text-purple-700 hover:border-purple-700 hover:bg-purple-200/50 active:border-purple-700 active:bg-purple-700 active:text-purple-100 dark:border-purple-700-dark dark:bg-transparent dark:text-purple-700-dark dark:hover:border-purple-700-dark dark:hover:bg-purple-200-dark/50 dark:active:border-purple-700-dark dark:active:bg-purple-700-dark dark:active:text-purple-200-dark"
                )}
              >
                {isDownloadingPdf ? (
                  <LoadingSpinner size="sm" className="w-3" />
                ) : (
                  <FontAwesomeIcon icon={faFilePdf} />
                )}
              </Button>
              <Button
                ref={setReference}
                type="button"
                variant="tertiary"
                size="md"
                presentationType="icon"
                aria-label="Subscribe for updates"
                aria-expanded={isNewsletterOpen}
                aria-haspopup="dialog"
                className={cn(
                  "relative z-10 border-purple-700 bg-transparent text-purple-700 hover:border-purple-700 hover:bg-purple-200/50 active:border-purple-700 active:bg-purple-700 active:text-purple-100 dark:border-purple-700-dark dark:bg-transparent dark:text-purple-700-dark dark:hover:border-purple-700-dark dark:hover:bg-purple-200-dark/50 dark:active:border-purple-700-dark dark:active:bg-purple-700-dark dark:active:text-purple-200-dark",
                  isNewsletterOpen &&
                    "bg-purple-700 text-purple-100 hover:bg-purple-700 dark:bg-purple-700-dark dark:text-purple-200-dark dark:hover:bg-purple-700-dark"
                )}
                {...getReferenceProps()}
              >
                <FontAwesomeIcon icon={faBell} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {isNewsletterOpen ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={setFloating}
              {...getFloatingProps()}
              style={{
                ...floatingStyles,
                visibility: isPositioned ? "visible" : "hidden",
              }}
              className="z-[120] w-[min(calc(100vw-1.5rem),348px)]"
            >
              <NewsletterSubscribePopover
                listKey={newsletterListKey}
                onClose={() => setIsNewsletterOpen(false)}
              />
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
}
