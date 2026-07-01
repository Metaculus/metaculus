"use client";

import { useLocale } from "next-intl";
import { FC, useEffect, useMemo } from "react";

import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import useAppTheme from "@/hooks/use_app_theme";
import { ChoiceItem } from "@/types/choices";
import { GroupOfQuestionsPost, QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/questions/choices";

import { useListChartExpanded } from "./consumer_list_chart_shell";
import GroupChartViewTabs from "./group_chart_view_tabs";
import {
  getDistributionColor,
  getSubquestionDistributionData,
  hasSubquestionDistribution,
} from "./group_distribution_utils";
import PdfCdfTabs from "./pdf_cdf_tabs";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  visibleQuestions?: QuestionWithNumericForecasts[];
  height?: number;
  // When the parent owns the view switcher (e.g. the fan-graph panel), hide the
  // internal Timeline/Distributions tabs and keep only the PDF/CDF toggle.
  hideViewTabs?: boolean;
};

// Distributions-mode chart body for a continuous group: header (view tabs +
// PDF/CDF toggle) and the selected subquestion's community distribution, colored
// to match its row. Display-only — never shows the user's own prediction.
const GroupDistributionsView: FC<Props> = ({
  post,
  visibleQuestions,
  height,
  hideViewTabs = false,
}) => {
  const locale = useLocale();
  const { getThemeColor } = useAppTheme();
  const {
    viewMode,
    setViewMode,
    selectedQuestionId,
    setSelectedQuestionId,
    graphType,
    setGraphType,
    setHoveredChoiceName,
  } = useListChartExpanded();

  const allQuestions = useMemo(
    () => visibleQuestions ?? post.group_of_questions?.questions ?? [],
    [visibleQuestions, post.group_of_questions?.questions]
  );

  // Same generation the neighbouring selector uses (the list rows, or the
  // fan-graph bins when visibleQuestions is a slice), so colors line up.
  const choices = useMemo(
    () =>
      generateChoiceItemsFromGroupQuestions(
        visibleQuestions ?? post.group_of_questions,
        { locale }
      ).filter((c): c is ChoiceItem & { id: number } => c.id != null),
    [visibleQuestions, post.group_of_questions, locale]
  );
  const colorById = useMemo(
    () => new Map(choices.map((c) => [c.id, c.color])),
    [choices]
  );
  const questionsById = useMemo(
    () => new Map(allQuestions.map((q) => [q.id, q])),
    [allQuestions]
  );
  const groupType = allQuestions.at(0)?.type ?? QuestionType.Numeric;

  const selectableIds = useMemo(() => {
    const ids = new Set<number>();
    for (const choice of choices) {
      const q = questionsById.get(choice.id);
      if (q && hasSubquestionDistribution(q)) ids.add(choice.id);
    }
    return ids;
  }, [choices, questionsById]);

  const defaultSelectedId = useMemo(() => {
    const firstOpen = choices.find((c) => {
      const q = questionsById.get(c.id);
      return q && q.status === QuestionStatus.OPEN && selectableIds.has(c.id);
    });
    if (firstOpen) return firstOpen.id;
    return choices.find((c) => selectableIds.has(c.id))?.id ?? null;
  }, [choices, questionsById, selectableIds]);

  const effectiveSelectedId =
    selectedQuestionId != null && selectableIds.has(selectedQuestionId)
      ? selectedQuestionId
      : defaultSelectedId;

  // Keep exactly one subquestion selected while in distributions mode.
  useEffect(() => {
    if (
      (selectedQuestionId == null || !selectableIds.has(selectedQuestionId)) &&
      defaultSelectedId != null
    ) {
      setSelectedQuestionId(defaultSelectedId);
    }
  }, [
    selectedQuestionId,
    selectableIds,
    defaultSelectedId,
    setSelectedQuestionId,
  ]);

  const selectedQuestion =
    effectiveSelectedId != null
      ? questionsById.get(effectiveSelectedId)
      : undefined;
  const selectedColor =
    effectiveSelectedId != null
      ? colorById.get(effectiveSelectedId)
      : undefined;

  return (
    <div
      className="flex h-full w-full flex-col"
      onMouseLeave={() => setHoveredChoiceName(null)}
    >
      <div className="mb-2.5 flex w-full items-center md:mb-5">
        {!hideViewTabs && (
          <GroupChartViewTabs value={viewMode} onChange={setViewMode} />
        )}
        <div className="ml-auto flex">
          <PdfCdfTabs
            value={graphType}
            onChange={setGraphType}
            questionType={groupType}
          />
        </div>
      </div>
      {selectedQuestion && selectedColor && (
        <ContinuousAreaChart
          question={selectedQuestion}
          data={getSubquestionDistributionData(selectedQuestion)}
          graphType={graphType}
          height={height}
          colorOverride={getThemeColor(
            getDistributionColor(selectedQuestion, selectedColor)
          )}
          onCursorChange={() => {}}
          cursorQuartileTooltip
        />
      )}
    </div>
  );
};

export default GroupDistributionsView;
