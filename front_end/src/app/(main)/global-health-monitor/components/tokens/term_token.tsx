"use client";

import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { TokenHoverCard } from "./token_hover_card";
import { DISEASE_NAME_KEYS, DiseaseId } from "../../config/diseases";

// Places, dates and other terms that deserve context but have no link.
export function Term({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <TokenHoverCard
      content={<span className="[text-wrap:pretty]">{tip}</span>}
      className="cursor-help border-b border-dashed border-current pb-px"
    >
      {children}
    </TokenHoverCard>
  );
}

export function DiseaseLink({
  d,
  children,
}: {
  d: DiseaseId;
  children: ReactNode;
}) {
  const t = useTranslations();

  return (
    <a
      href={`#${d}`}
      title={t("globalHealthMonitorGoToSection", {
        disease: t(DISEASE_NAME_KEYS[d]),
      })}
      className="text-inherit underline decoration-blue-400 decoration-1 underline-offset-[3px] hover:decoration-blue-700 dark:decoration-blue-400-dark dark:hover:decoration-blue-700-dark"
    >
      {children}
    </a>
  );
}
