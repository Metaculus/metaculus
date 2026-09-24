import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import { resolveAssetSource } from "../helpers/assets";
import { InitiativeQuote, QuoteAccent } from "../types";

const ACCENT_BORDER: Record<QuoteAccent, string> = {
  blue: "border-[#2C77B4]",
  purple: "border-purple-700 dark:border-purple-700-dark",
};

type Props = {
  quote: InitiativeQuote;
  size: "md" | "lg";
  className?: string;
};

const InitiativeQuoteFigure: FC<Props> = ({ quote, size, className }) => {
  const t = useTranslations();
  const { quoteKey, authorKey, roleKey, avatar, accent } = quote;
  const avatarSource = avatar ? resolveAssetSource(avatar) : null;
  const isLarge = size === "lg";

  return (
    <figure
      className={cn(
        "m-0 flex w-full flex-col",
        isLarge ? "justify-between gap-10 xl:gap-12" : "gap-4",
        className
      )}
    >
      <blockquote
        lang="en"
        className={cn(
          "m-0 border-l-2 pl-5 text-left font-normal text-blue-900 dark:text-blue-900-dark",
          isLarge
            ? "max-w-[367px] text-[20px] leading-[140%] tracking-[-0.005em]"
            : "text-[17px] leading-[27.2px]",
          ACCENT_BORDER[accent ?? "blue"]
        )}
      >
        {t(quoteKey)}
      </blockquote>

      <figcaption
        className={cn(
          "flex items-center gap-3 text-left",
          isLarge && "min-h-11"
        )}
      >
        {avatarSource ? (
          <Image
            src={avatarSource.src}
            unoptimized={avatarSource.unoptimized}
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          isLarge && (
            <span
              aria-hidden="true"
              className="size-11 shrink-0 rounded-full bg-blue-300 dark:bg-blue-300-dark"
            />
          )
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold leading-[16.8px] text-blue-900 dark:text-blue-900-dark">
            {t(authorKey)}
          </span>
          <span className="text-[12.5px] font-normal leading-[16.25px] text-blue-700 dark:text-blue-700-dark">
            {t(roleKey)}
          </span>
        </span>
      </figcaption>
    </figure>
  );
};

export default InitiativeQuoteFigure;
