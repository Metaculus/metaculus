import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { TranslationKey } from "@/types/translations";
import cn from "@/utils/core/cn";

import InitiativeMark from "./initiative_mark";
import {
  DEFAULT_INITIATIVE_COLOR,
  getReadableForeground,
} from "../helpers/contrast";
import { Initiative, InitiativesInventoryView } from "../types";

type Props = {
  initiative: Initiative;
  view: InitiativesInventoryView;
  categoryLabelKey?: TranslationKey;
};

const InitiativeInventoryCard: FC<Props> = ({
  initiative,
  view,
  categoryLabelKey,
}) => {
  const t = useTranslations();
  const name = t(initiative.nameKey);
  const color = initiative.brand?.color ?? DEFAULT_INITIATIVE_COLOR;
  const descriptionKey =
    initiative.feature?.descriptionKey ?? initiative.taglineKey;
  return (
    <li className="min-w-0 list-none">
      <Link
        href={initiative.url}
        className={cn(
          "group block min-w-0 no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800 dark:focus-visible:outline-blue-800-dark",
          view === "list" &&
            "lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-8"
        )}
      >
        <div
          aria-hidden="true"
          className="relative flex aspect-[3/2] min-w-0 items-center justify-center gap-2 overflow-hidden px-6"
          style={{
            backgroundColor: color,
            color: getReadableForeground(color),
          }}
        >
          <Image
            src="/images/initiatives/inventory-fallback.png"
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1280px) 420px, (min-width: 768px) 50vw, 100vw"
            className="pointer-events-none object-cover"
          />
          <div className="relative flex w-full justify-center">
            <div className="flex w-fit max-w-full items-center gap-2">
              <InitiativeMark
                initiative={initiative}
                name={name}
                className="size-10 shrink-0 rounded-none"
              />
              <span className="min-w-0 max-w-[220px] break-words text-center text-[21.067px] font-semibold leading-[29.494px] text-white">
                {name}
              </span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col items-start pt-5",
            view === "list" && "lg:pt-0"
          )}
        >
          <p className="m-0 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-700-dark">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0"
              style={{ backgroundColor: color }}
            />
            {categoryLabelKey ? t(categoryLabelKey) : name}
          </p>
          <h3 className="m-0 mt-2 text-[22px] font-medium leading-[115%] tracking-tight text-blue-900 dark:text-blue-900-dark">
            {name}
          </h3>
          <p className="m-0 mt-4 text-sm leading-6 text-blue-800 dark:text-blue-800-dark">
            {t(descriptionKey)}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-900 dark:text-blue-900-dark">
            {t("explore")}
            <FontAwesomeIcon
              icon={faArrowRight}
              aria-hidden="true"
              className="h-3 w-3 transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
            />
          </span>
        </div>
      </Link>
    </li>
  );
};

export default InitiativeInventoryCard;
