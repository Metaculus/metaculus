import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import {
  INITIATIVE_FALLBACK_ARTWORK,
  resolveAssetSource,
} from "../helpers/assets";
import { FeaturedInitiative } from "../types";

type Props = {
  initiative: FeaturedInitiative;
  artworkSide: "start" | "end";
};

const FeaturedInitiativeRow: FC<Props> = ({ initiative, artworkSide }) => {
  const t = useTranslations();
  const { feature } = initiative;
  const name = t(initiative.nameKey);

  return (
    <article
      className={cn(
        "grid grid-cols-1 gap-12 xl:gap-6",
        artworkSide === "start"
          ? "xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          : "xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      )}
    >
      <Link
        href={initiative.url}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          "relative block aspect-[1800/1310] w-full overflow-hidden",
          artworkSide === "start" ? "xl:col-start-1" : "xl:col-start-2"
        )}
        style={{ backgroundColor: initiative.brand.color }}
      >
        <Image
          src={initiative.artwork ?? INITIATIVE_FALLBACK_ARTWORK}
          unoptimized
          alt=""
          fill
          sizes="(min-width: 1280px) 66vw, 100vw"
          className="object-cover"
        />
      </Link>

      <div
        className={cn(
          "flex min-w-0 flex-col items-start justify-between gap-8 text-left",
          artworkSide === "start"
            ? "xl:col-start-2 xl:row-start-1"
            : "xl:col-start-1 xl:row-start-1"
        )}
      >
        <div className="flex flex-col items-start gap-6">
          {feature.badgeKey && (
            <span className="flex items-center justify-center gap-2 bg-blue-400 px-1.5 py-1 text-xs font-medium uppercase leading-3 tracking-[1px] text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark md:mb-2">
              {t(feature.badgeKey)}
            </span>
          )}

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
