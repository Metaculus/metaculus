"use client";

import { faFilePdf } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading_spiner";
import cn from "@/utils/core/cn";

export const hubActionButtonClassName =
  "relative z-10 border-purple-700 bg-transparent text-purple-700 hover:border-purple-700 hover:bg-purple-200/50 active:border-purple-700 active:bg-purple-700 active:text-purple-100 dark:border-purple-700-dark dark:bg-transparent dark:text-purple-700-dark dark:hover:border-purple-700-dark dark:hover:bg-purple-200-dark/50 dark:active:border-purple-700-dark dark:active:bg-purple-700-dark dark:active:text-purple-200-dark";

export type HubPdf = { url: string; fileName: string };

export function PdfDownloadButton({
  pdf,
  labelled = false,
  className,
}: {
  pdf: HubPdf;
  /** A regular button with a "Download PDF" label instead of the icon-only one. */
  labelled?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(pdf.url);

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        let errorMessage = "Failed to generate the PDF.";

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
      downloadLink.download = pdf.fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to download PDF", error);
      toast.error(t("hubPdfDownloadFailed"));
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, pdf, t]);

  const icon = isDownloading ? (
    <LoadingSpinner size="sm" className="w-3" />
  ) : (
    <FontAwesomeIcon icon={faFilePdf} />
  );

  if (labelled) {
    return (
      <Button
        type="button"
        variant="tertiary"
        size="md"
        aria-busy={isDownloading}
        disabled={isDownloading}
        onClick={handleDownload}
        className={className}
      >
        {icon}
        {isDownloading ? t("hubDownloadingPdf") : t("hubDownloadPdf")}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="tertiary"
      size="md"
      presentationType="icon"
      aria-label={isDownloading ? t("hubDownloadingPdf") : t("hubDownloadPdf")}
      aria-busy={isDownloading}
      disabled={isDownloading}
      onClick={handleDownload}
      className={cn(hubActionButtonClassName, className)}
    >
      {icon}
    </Button>
  );
}
