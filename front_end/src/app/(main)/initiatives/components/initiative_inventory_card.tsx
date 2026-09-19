import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import InitiativeMark from "./initiative_mark";
import { INITIATIVE_FALLBACK_ARTWORK } from "../helpers/assets";
import {
  DEFAULT_INITIATIVE_COLOR,
  getReadableForeground,
} from "../helpers/contrast";
import { Initiative, InitiativesInventoryView } from "../types";

type Props = {
  initiative: Initiative;
  view: InitiativesInventoryView;
};

const InitiativeInventoryCard: FC<Props> = ({ initiative, view }) => {
  const t = useTranslations();
  const name = t(initiative.inventoryNameKey ?? initiative.nameKey);
  const color = initiative.brand?.color ?? DEFAULT_INITIATIVE_COLOR;
  const descriptionKey =
    initiative.inventoryDescriptionKey ?? initiative.feature?.descriptionKey;
  return (
    <li className="min-w-0 list-none">
      <Link
        href={initiative.url}
        className={cn(
          "group block min-w-0 no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800 dark:focus-visible:outline-blue-800-dark",
          view === "list" &&
            "min-[769px]:grid min-[769px]:grid-cols-[minmax(0,420px)_minmax(0,1fr)] min-[769px]:gap-8"
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
            src={INITIATIVE_FALLBACK_ARTWORK}
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
              <span className="min-w-0 max-w-[220px] break-words text-center text-[21.067px] font-semibold leading-[29.494px]">
                {name}
              </span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col items-start pt-5",
            view === "list" && "min-[769px]:pt-0"
          )}
        >
          <h3 className="m-0 mt-2 self-stretch text-[26px] font-medium leading-[110%] tracking-[-1.56px] text-blue-900 dark:text-blue-900-dark">
            {name}
          </h3>
          {descriptionKey && (
            <p className="m-0 mt-4 self-stretch text-[15px] font-normal leading-6 text-blue-800 dark:text-blue-800-dark">
              {t(descriptionKey)}
            </p>
          )}
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold leading-[14px] text-blue-900 dark:text-blue-900-dark">
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
