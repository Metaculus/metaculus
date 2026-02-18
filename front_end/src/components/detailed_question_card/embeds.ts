import { METAC_COLORS } from "@/constants/colors";
import { ChoiceItem } from "@/types/choices";
import { ThemeColor } from "@/types/theme";

export const getMaxVisibleCheckboxes = (embedMode: boolean): number => {
  if (!embedMode) return 3;
  return 4;
};

const OTHERS_COLOR: ThemeColor = METAC_COLORS.gray[400];

export function buildEmbedChoicesWithOthers(
  choices: ChoiceItem[],
  baseCount: number,
  othersLabel: string
): ChoiceItem[] {
  if (choices.length <= baseCount) return choices;

  const head = choices.slice(0, baseCount);
  const tail = choices.slice(baseCount);
  const aggLen = Math.max(
    ...tail.map((c) => c.aggregationValues?.length ?? 0),
    0
  );
  const aggregationValues = Array.from({ length: aggLen }, (_, i) =>
    tail.reduce((sum, c) => sum + (c.aggregationValues?.[i] ?? 0), 0)
  );

  const userLen = Math.max(...tail.map((c) => c.userValues?.length ?? 0), 0);
  const userValues: (number | null)[] =
    userLen > 0
      ? Array.from({ length: userLen }, (_, i) =>
          tail.reduce((sum, c) => sum + (c.userValues?.[i] ?? 0), 0)
        )
      : [];

  const template = tail[0];

  const others: ChoiceItem = {
    ...template,
    choice: othersLabel,
    color: OTHERS_COLOR,
    aggregationValues,
    userValues,
    resolution: null,
    displayedResolution: null,
    active: true,
    highlighted: template?.highlighted ?? false,
    aggregationTimestamps: template?.aggregationTimestamps ?? [],
    aggregationMinValues:
      template?.aggregationMinValues?.map((v) => v ?? 0) ?? [],
    aggregationMaxValues:
      template?.aggregationMaxValues?.map((v) => v ?? 0) ?? [],
    userTimestamps: template?.userTimestamps ?? [],
    aggregationForecasterCounts:
      template?.aggregationForecasterCounts?.map((v) => v ?? 0) ?? [],
  };

  return [...head, others];
}
