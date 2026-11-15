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
  const accentBorder = ACCENT_BORDER[accent ?? "blue"];

  // "lg" is a standalone testimonial; "md" sits inside a featured card, so it
  // becomes its own subtle card with one text size throughout.
  return (
    <figure
      className={cn(
        "m-0 flex w-full flex-col",
        isLarge
          ? "justify-between gap-10 xl:gap-12"
          : cn(
              "gap-3 border-l-2 bg-blue-200 p-4 dark:bg-blue-100-dark",
              accentBorder
            ),
        className
      )}
    >
      <blockquote
        lang="en"
        className={cn(
          "m-0 text-left font-normal text-blue-900 dark:text-blue-900-dark",
          isLarge
            ? cn(
                "max-w-[367px] border-l-2 pl-5 text-[20px] leading-[140%] tracking-[-0.005em]",
                accentBorder
              )
            : "text-sm leading-[22px]"
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
          <span
            className={cn(
              "text-sm font-semibold text-blue-900 dark:text-blue-900-dark",
              isLarge ? "leading-[16.8px]" : "leading-5"
            )}
          >
            {t(authorKey)}
          </span>
          <span
            className={cn(
              "font-normal text-blue-700 dark:text-blue-700-dark",
              isLarge ? "text-[12.5px] leading-[16.25px]" : "text-sm leading-5"
            )}
          >
            {t(roleKey)}
          </span>
        </span>
      </figcaption>
    </figure>
  );
};

export default InitiativeQuoteFigure;
