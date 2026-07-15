"use client";

import { FC } from "react";

import DateForecastCard from "@/components/consumer_post_card/group_forecast_card/date_forecast_card";
import { useHideCP } from "@/contexts/cp_context";
import { GroupOfQuestionsPost } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";

import { useListChartExpanded } from "./consumer_list_chart_shell";
import GroupChartViewTabs from "./group_chart_view_tabs";
import { hasSubquestionDistribution } from "./group_distribution_utils";
import GroupDistributionsView from "./group_distributions_view";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
};

const CHART_HEADER_HEIGHT = 44;

const ConsumerDateGroupChart: FC<Props> = ({ post }) => {
  const { hideCP } = useHideCP();
  const { viewMode, setViewMode, chartAreaHeight } = useListChartExpanded();
  const effectiveChartHeight =
    chartAreaHeight > 0
      ? Math.max(80, chartAreaHeight - CHART_HEADER_HEIGHT)
      : undefined;

  const canShowDistributions = (post.group_of_questions?.questions ?? []).some(
    hasSubquestionDistribution
  );

  if (!hideCP && canShowDistributions && viewMode === "distributions") {
    return <GroupDistributionsView post={post} height={effectiveChartHeight} />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      {!hideCP && canShowDistributions && (
        <div className="mb-2.5 flex w-full items-center md:mb-5">
          <GroupChartViewTabs value={viewMode} onChange={setViewMode} />
        </div>
      )}
      <DateForecastCard
        post={post}
        questionsGroup={post.group_of_questions}
        fillHeight
        innerChartPaddingX={20}
        yearOnlyTicks
      />
    </div>
  );
};

export default ConsumerDateGroupChart;
