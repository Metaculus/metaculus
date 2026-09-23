import Link from "next/link";
import { useTranslations } from "next-intl";
import { CSSProperties, FC } from "react";

import cn from "@/utils/core/cn";

import MaskedLogo from "./masked_logo";
import { getAccessibleAccent } from "../helpers/contrast";
import { Initiative, InitiativesInventoryView } from "../types";

type Props = {
  initiative: Initiative;
  color: string;
  view: InitiativesInventoryView;
  titleAs?: "h3" | "h4";
};

const InitiativeInventoryCard: FC<Props> = ({
  initiative,
  color,
  view,
  titleAs: Title = "h3",
}) => {
  const t = useTranslations();
  const name = t(initiative.inventoryNameKey ?? initiative.nameKey);
  const descriptionKey =
    initiative.inventoryDescriptionKey ?? initiative.feature?.descriptionKey;
  const isList = view === "list";

  return (
    <Link
      href={initiative.url}
      className={cn(
        "flex h-full flex-col bg-[color-mix(in_srgb,var(--initiative-color)_15%,transparent)] text-[var(--initiative-accent)] no-underline transition-[box-shadow,background-color] duration-200 ease-out hover:bg-[color-mix(in_srgb,var(--initiative-color)_20%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800 motion-reduce:transition-none dark:text-white dark:focus-visible:outline-blue-800-dark",
        "hover:[box-shadow:0_0_0_6px_var(--initiative-tile-gap),0_0_0_10px_color-mix(in_srgb,var(--initiative-color)_50%,transparent)] active:[box-shadow:0_0_0_6px_var(--initiative-tile-gap),0_0_0_10px_var(--initiative-color)]",
        isList
          ? "gap-1 p-5"
          : "min-h-[66.667cqw] justify-between gap-8 p-6 md:p-8"
      )}
      style={
        {
          "--initiative-color": color,
          "--initiative-accent": getAccessibleAccent(color),
        } as CSSProperties
      }
    >
      <div
        className={cn(
          "flex",
          isList ? "items-center gap-3" : "items-start justify-between gap-6"
        )}
      >
        <Title className="m-0 text-2xl font-semibold leading-[140%] tracking-[-1.44px] text-inherit">
          {name}
        </Title>
        {initiative.logo && (
          <MaskedLogo
            src={initiative.logo}
            alt=""
            width={42}
            height={42}
            className={cn(
              "shrink-0 bg-[var(--initiative-accent)] dark:bg-white",
              isList && "order-first"
            )}
            imageClassName={isList ? "size-5" : "size-[42px]"}
          />
        )}
      </div>

      {descriptionKey && (
        <p className="m-0 text-base font-normal leading-6">
          {t(descriptionKey)}
        </p>
      )}
    </Link>
  );
};

export default InitiativeInventoryCard;
