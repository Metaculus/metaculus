"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { KIND_COLOR } from "./milestone_card";
import { QuestionKind } from "../data/questions";

const KindChip: FC<{ kind: QuestionKind }> = ({ kind }) => {
  const t = useTranslations();
  const color = KIND_COLOR[kind];

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[rgba(var(--wby-ink),.1)] bg-[rgba(var(--wby-ink),.07)] py-[3px] pl-[7px] pr-[9px]">
      <i
        className="size-[7px] shrink-0 rounded-[2px]"
        style={{ background: color }}
      />
      <span style={{ color }}>
        {t(kind === "cap" ? "worldByYearCapability" : "worldByYearAdoption")}
      </span>
    </span>
  );
};

export default KindChip;
