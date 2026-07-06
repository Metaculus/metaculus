import { useTranslations } from "next-intl";

import {
  DefaultIndexData,
  IndexData,
  MultiYearIndexData,
} from "@/types/projects";
import { bucketRelativeMs } from "@/utils/formatters/date";

export const isMultiYearIndexData = (
  d: IndexData | null | undefined
): d is MultiYearIndexData =>
  !!d && typeof d === "object" && "series_by_year" in d;

export const isDefaultIndexData = (
  d: IndexData | null | undefined
): d is DefaultIndexData => !!d && (d.type === "default" || !d.type);

export function formatTournamentRelativeDelta(
  t: ReturnType<typeof useTranslations>,
  deltaMs: number,
  { fromNow = false }: { fromNow?: boolean } = {}
): string {
  const r = bucketRelativeMs(Math.abs(deltaMs));
  if (r.kind === "soon") return t("tournamentRelativeSoon");
  if (r.kind === "farFuture") return t("tournamentRelativeFarFuture");
  if (r.kind === "underMinute") return t("tournamentRelativeUnderMinute");
  const { n, unit } = r.value;
  const unitLabel =
    n === 1
      ? t("tournamentUnit", { unit })
      : t("tournamentUnitPlural", { unit });
  if (fromNow) return t("tournamentRelativeFromNow", { n, unit: unitLabel });
  return `${n} ${unitLabel}`;
}
