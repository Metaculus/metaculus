"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/button";
import { LightDarkIcon } from "@/components/ui/light-dark-icon";
import StackedPreviewImage from "@/components/ui/stacked-preview-image";
import cn from "@/utils/core/cn";

import { TCaseStudyCard } from "./types";

type Props = {
  card: TCaseStudyCard;
  className?: string;
};

const CaseStudyCard: React.FC<Props> = ({ card, className }) => {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-gray-0 p-4 text-gray-800 antialiased dark:bg-gray-0-dark dark:text-gray-800-dark sm:flex-row sm:gap-8 sm:p-8",
        className
      )}
    >
      <div>
        <h6 className="my-0 text-[18px] font-bold leading-[28px] text-blue-800 dark:text-blue-800-dark sm:text-xl">
          {card.title}
        </h6>

        <div className="mt-2 text-sm font-medium text-blue-800 dark:text-blue-800-dark">
          <div
            className={cn(
              "overflow-hidden",
              "[-webkit-box-orient:vertical] [display:-webkit-box]",
              "[-webkit-line-clamp:5] sm:[-webkit-line-clamp:7]"
            )}
          >
            {!!card.body.intro && <p className="m-0">{card.body.intro}</p>}

            <ul className="m-0 list-disc pl-5">
              {card.body.bullets.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-3 h-[2px] bg-gray-200 opacity-20 dark:bg-gray-200-dark dark:opacity-20 sm:my-6" />

        {!!card.aboutInitiative && (
          <div className="text-sm font-medium antialiased">
            <h6 className="my-0 text-sm font-medium text-gray-600 dark:text-gray-600-dark">
              {t("aboutInitiative")}
            </h6>
            <p className="my-0 mt-2 text-blue-800 dark:text-blue-800-dark">
              {card.aboutInitiative}
            </p>
          </div>
        )}

        {!!card.partners?.logos?.length && (
          <hr className="my-3 h-[2px] bg-gray-200 opacity-20 dark:bg-gray-200-dark dark:opacity-20 sm:my-6" />
        )}

        {!!card.partners?.logos?.length && (
          <div>
            <p className="my-0 text-sm font-medium text-gray-600 dark:text-gray-600-dark">
              {card.partners.label ?? t("inPartnershipWith")}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
              {card.partners.logos.map((logo, idx) => {
                const light = logo.lightSrc ?? logo.src;
                const dark = logo.darkSrc ?? logo.src;

                const content = (
                  <LightDarkIcon
                    alt={logo.alt}
                    light={light}
                    dark={dark}
                    sizePx={logo.sizePx ?? 14}
                    variant="logo"
                    className="shrink-0"
                  />
                );

                return logo.href ? (
                  <a
                    key={`${logo.alt}-${idx}`}
                    href={logo.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                    aria-label={logo.alt}
                  >
                    {content}
                  </a>
                ) : (
                  <span key={`${logo.alt}-${idx}`} className="inline-flex">
                    {content}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="min-w-[260px] md:min-w-[300px] lg:min-w-[357px]">
        {!!card.report && (
          <div
            className={cn(
              "group/preview flex flex-row items-center gap-3 rounded-lg bg-blue-200 p-3 sm:flex-col sm:gap-5 sm:px-[27px] sm:py-6",
              "transition-colors duration-500 ease-out",
              "dark:bg-blue-200-dark"
            )}
          >
            <StackedPreviewImage
              src={card.report.previewImageSrc}
              alt={card.report.previewImageAlt ?? t("reportPreviewAlt")}
              perspective={1400}
              origin="right"
              className="hidden sm:block"
            />

            <Image
              src={card.report.previewImageSrc}
              alt={card.report.previewImageAlt ?? t("reportPreviewAlt")}
              height={50}
              className="h-[50px] w-auto rounded object-cover sm:hidden"
              unoptimized
            />

            <hr className="my-0 hidden h-[2px] w-full bg-gray-200 opacity-20 dark:bg-gray-200-dark dark:opacity-20 sm:block" />

            <div className="flex flex-col text-xs text-gray-600 dark:text-gray-600-dark sm:items-center sm:text-sm">
              <div className="font-medium sm:font-bold">
                {card.report.fileName}
              </div>

              <div className="mt-2 text-nowrap font-medium sm:mt-1">
                <span>
                  {t("pagesWithCount", { count: card.report.pageCount })}
                </span>
                <span className="mx-2 text-gray-300 dark:text-gray-300-dark">
                  •
                </span>
                <span>
                  {t("publishedWithLabel", {
                    label: card.report.publishedAtLabel,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          href={card.cta.href}
          className="mt-3 w-full rounded-full bg-blue-800 py-[15px] text-sm text-gray-0 hover:bg-blue-900 active:bg-blue-800  dark:bg-blue-800-dark dark:text-gray-0-dark dark:hover:bg-blue-900-dark dark:active:bg-blue-800-dark"
        >
          {t((card.cta.labelKey || "readTheReport") as "readTheReport")}
        </Button>
      </div>
    </div>
  );
};

export default CaseStudyCard;
