"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import ButtonGroup, { type GroupButton } from "@/components/ui/button_group";
import { CPChangeThreshold, PostSubscriptionCPCHange } from "@/types/post";

import { SubscriptionSectionProps } from "./types";

type CpKey = "small" | "medium" | "large";

const toKey = (v: CPChangeThreshold): CpKey =>
  v === CPChangeThreshold.SMALL
    ? "small"
    : v === CPChangeThreshold.MEDIUM
      ? "medium"
      : "large";

const fromKey = (k: CpKey): CPChangeThreshold =>
  k === "small"
    ? CPChangeThreshold.SMALL
    : k === "medium"
      ? CPChangeThreshold.MEDIUM
      : CPChangeThreshold.LARGE;

const SubscriptionSectionCPChange: FC<
  SubscriptionSectionProps<PostSubscriptionCPCHange, "cp_change_threshold">
> = ({ subscription, onChange }) => {
  const t = useTranslations();

  const buttons: GroupButton<CpKey>[] = useMemo(
    () => [
      { value: "small", label: "small" },
      { value: "medium", label: "medium" },
      { value: "large", label: "large" },
    ],
    []
  );

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{t("followModalNotifyMeFor")} </span>
        <ButtonGroup
          value={toKey(subscription.cp_change_threshold)}
          buttons={buttons}
          onChange={(k) => onChange("cp_change_threshold", fromKey(k))}
          variant="secondary"
          activeVariant="primary"
          className="px-2 py-1 text-xs"
          activeClassName="px-2 py-1 text-xs"
        />
        <span className="text-sm">{t("changes", { default: "changes." })}</span>
      </div>

      <ul className="list-disc pl-[14px] text-xs opacity-80">
        <li>{t("followModalSmallChanges")} (45% → 55% / 90% → 95%)</li>
        <li>{t("followModalMediumChanges")} (40% → 60% / 90% → 98%)</li>
        <li>{t("followModalLargeChanges")} (35% → 65% / 90% → 99.8%)</li>
      </ul>
    </div>
  );
};

export default SubscriptionSectionCPChange;
