"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import ButtonGroup, { type GroupButton } from "@/components/ui/button_group";
import { PostSubscriptionMilestone } from "@/types/post";

import { SubscriptionSectionProps } from "./types";

const SubscriptionSectionMilestone: FC<
  SubscriptionSectionProps<PostSubscriptionMilestone, "milestone_step">
> = ({ subscription, onChange, post }) => {
  const t = useTranslations();

  const buttons: GroupButton<"1" | "5" | "10" | "20">[] = useMemo(
    () => [
      { value: "1", label: "1%" },
      { value: "5", label: "5%" },
      { value: "10", label: "10%" },
      { value: "20", label: "20%" },
    ],
    []
  );

  const current = (subscription.milestone_step * 100).toString() as
    | "1"
    | "5"
    | "10"
    | "20";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{t("followModalNotifyMeEvery")} </span>
        <ButtonGroup
          value={current}
          buttons={buttons}
          onChange={(v) => onChange("milestone_step", Number(v) / 100)}
          variant="secondary"
          activeVariant="primary"
          className="px-2 py-1 text-xs"
          activeClassName="px-2 py-1 text-xs"
        />
      </div>

      <p className="text-xs opacity-80">
        {post.group_of_questions
          ? t("followModalMilestoneLifetimeParagraphGroup")
          : t("followModalMilestoneLifetimeParagraphQuestion")}
      </p>
    </div>
  );
};

export default SubscriptionSectionMilestone;
