import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { resolveAssetSource } from "../helpers/assets";
import { FeaturedInitiative } from "../types";

type Props = {
  initiative: FeaturedInitiative;
  artworkSide: "start" | "end";
};

const FeaturedInitiativeRow: FC<Props> = ({ initiative, artworkSide }) => {
  const t = useTranslations();
  const { feature } = initiative;
  const name = t(initiative.nameKey);
  const label =
    initiative.categoryId === "ai"
      ? t("initiativesCategoryAI")
      : initiative.categoryId === "policy"
        ? t("initiativesCategoryPolicy")
        : name;
  const artwork = initiative.artwork
    ? resolveAssetSource(initiative.artwork)
    : null;

  return (
    <article
      className={cn(
        "grid grid-cols-1 gap-12 md:gap-6",
        artworkSide === "start"
          ? "md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          : "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      )}
    >
      <div
        className={cn(
          "relative aspect-[1800/1310] w-full overflow-hidden",
          artworkSide === "start" ? "md:col-start-1" : "md:col-start-2"
        )}
        style={{ backgroundColor: initiative.brand.color }}
      >
        {artwork && (
          <Image
            src={artwork.src}
            unoptimized
            alt=""
            fill
            sizes="(min-width: 1024px) 640px, (min-width: 768px) calc((100vw - 64px) * 2 / 3), (min-width: 640px) calc(100vw - 32px), 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col items-start justify-between gap-8 text-left",
          artworkSide === "start"
            ? "md:col-start-2 md:row-start-1"
            : "md:col-start-1 md:row-start-1"
        )}
      >
        <div className="flex flex-col items-start gap-6">
          <p className="m-0 flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-700-dark md:mb-2">
            <span
              aria-hidden="true"
              className="size-1.5"
              style={{ backgroundColor: initiative.brand.color }}
            />
            {label}
            {feature.badgeKey && (
              <span className="rounded-sm border border-blue-400 px-1 text-[10px] font-semibold uppercase leading-4 text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark">
                {t(feature.badgeKey)}
              </span>
            )}
          </p>

          <h3 className="m-0 text-[32px] font-medium leading-[110%] tracking-[-1.92px] text-blue-900 dark:text-blue-900-dark">
            {t(feature.headingKey)}
          </h3>

          <p className="m-0 text-[17px] font-normal leading-[27.2px] text-blue-900 dark:text-blue-900-dark">
            {t(feature.descriptionKey)}
          </p>

          <Button
            href={initiative.url}
            variant="secondary"
            size="sm"
            aria-label={t("initiativesFeaturedLearnMoreAbout", { name })}
            className="h-9 rounded-md border-[rgba(33,48,67,0.40)] bg-transparent px-3.5 py-0 font-semibold leading-[14px] text-blue-900 dark:border-blue-500-dark dark:bg-transparent dark:text-blue-900-dark"
          >
            {t("initiativesFeaturedLearnMore")}
          </Button>
        </div>

        {feature.partners && feature.partners.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-[12px] font-medium uppercase leading-[12px] tracking-[1.68px] text-blue-700 dark:text-blue-700-dark">
              {t("initiativesFeaturedPartneringWith")}
            </p>
            <ul className="m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0">
              {feature.partners.map((partner) => {
                const logo = resolveAssetSource(partner.logo);
                const image = (
                  <Image
                    src={logo.src}
                    unoptimized={logo.unoptimized}
                    alt={t(partner.nameKey)}
                    width={240}
                    height={80}
                    className="h-8 w-auto opacity-50 dark:invert"
                  />
                );

                return (
                  <li key={partner.logo}>
                    {partner.url ? (
                      <a
                        href={partner.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {image}
                      </a>
                    ) : (
                      image
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
};

export default FeaturedInitiativeRow;
