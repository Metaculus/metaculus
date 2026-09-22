import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CSSProperties, FC } from "react";

import cn from "@/utils/core/cn";

import { resolveAssetSource } from "../helpers/assets";
import { DEFAULT_INITIATIVE_COLOR } from "../helpers/contrast";
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
  const logo = initiative.logo ? resolveAssetSource(initiative.logo) : null;
  const isList = view === "list";

  return (
    <li className="min-w-0 list-none @container">
      <Link
        href={initiative.url}
        className={cn(
          "flex h-full flex-col no-underline transition-shadow duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800 motion-reduce:transition-none dark:focus-visible:outline-blue-800-dark",
          "hover:[box-shadow:inset_0_0_0_6px_var(--initiative-tile-gap),0_0_0_4px_color-mix(in_srgb,var(--initiative-brand)_50%,transparent)] active:[box-shadow:inset_0_0_0_6px_var(--initiative-tile-gap),0_0_0_4px_var(--initiative-brand)]",
          isList
            ? "gap-1 p-5"
            : "min-h-[66.667cqw] justify-between gap-8 p-6 md:p-8"
        )}
        style={
          {
            "--initiative-brand": color,
            backgroundColor: color,
            color: "#FFF",
          } as CSSProperties
        }
      >
        <div
          className={cn(
            "flex",
            isList ? "items-center gap-3" : "items-start justify-between gap-6"
          )}
        >
          <h3
            className={cn(
              "m-0 text-2xl font-semibold leading-[140%] tracking-[-1.44px] text-inherit"
            )}
          >
            {name}
          </h3>
          {logo && (
            <Image
              src={logo.src}
              unoptimized={logo.unoptimized}
              alt=""
              width={42}
              height={42}
              draggable={false}
              className={cn(
                "shrink-0",
                isList ? "order-first size-5" : "size-[42px]"
              )}
            />
          )}
        </div>

        {descriptionKey && (
          <p className="m-0 text-base font-normal leading-6">
            {t(descriptionKey)}
          </p>
        )}
      </Link>
    </li>
  );
};

export default InitiativeInventoryCard;
