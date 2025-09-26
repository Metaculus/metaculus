"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import ButtonGroup, { type GroupButton } from "@/components/ui/button_group";
import { PostSubscriptionNewComments } from "@/types/post";

import { SubscriptionSectionProps } from "./types";

const SubscriptionSectionNewComments: FC<
  SubscriptionSectionProps<PostSubscriptionNewComments, "comments_frequency">
> = ({ subscription, onChange }) => {
  const t = useTranslations();

  const buttons: GroupButton<"1" | "3" | "10">[] = useMemo(
    () => [
      { value: "1", label: "1" },
      { value: "3", label: "3" },
      { value: "10", label: "10" },
    ],
    []
  );

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-sm">{t("notifyMe")} </span>
      <ButtonGroup
        value={String(subscription.comments_frequency) as "1" | "3" | "10"}
        buttons={buttons}
        onChange={(v) => onChange("comments_frequency", Number(v))}
        variant="secondary"
        activeVariant="primary"
        className="px-2 py-1 text-xs"
        activeClassName="px-2 py-1 text-xs"
      />
      <span className="text-sm">{t("comments")}.</span>
    </div>
  );
};

export default SubscriptionSectionNewComments;
