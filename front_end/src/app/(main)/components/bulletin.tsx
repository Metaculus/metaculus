"use client";

import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";
import sanitizeHtml from "sanitize-html";

import cn from "@/utils/core/cn";

const sanitizeBulletinHtml = (content: string): string =>
  sanitizeHtml(content, {
    allowedTags: ["a", "b", "br", "del", "em", "i", "s", "strong", "u"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === "_blank" && !attribs.rel) {
          return {
            tagName,
            attribs: {
              ...attribs,
              rel: "noopener noreferrer",
            },
          };
        }

        return { tagName, attribs };
      },
    },
  });

const Bulletin: FC<{
  text: string;
  className?: string;
  onHidden?: () => void;
}> = ({ text, className, onHidden }) => {
  const t = useTranslations();
  const sanitizedText = useMemo(() => sanitizeBulletinHtml(text), [text]);

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center bg-mint-500 px-8 py-2 text-xs text-gray-900 md:text-sm",
        className
      )}
    >
      {onHidden && (
        <button
          aria-label={t("dismiss")}
          className="absolute right-3 top-2 inline cursor-pointer hover:text-gray-700"
          onClick={onHidden}
          type="button"
        >
          <FontAwesomeIcon icon={faClose} />
        </button>
      )}
      <div
        className="text-pretty text-center"
        dangerouslySetInnerHTML={{
          __html: sanitizedText,
        }}
        suppressHydrationWarning
      />
    </div>
  );
};

export default Bulletin;
