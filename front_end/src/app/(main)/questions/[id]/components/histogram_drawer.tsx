"use client";

import { useTranslations } from "next-intl";
import React from "react";

import Histogram from "@/app/(main)/charts/histogram";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";

const MAX_COLLAPSED_HEIGHT = 256;

type Props = {
  post: PostWithForecasts;
  // question: QuestionWithNumericForecasts;
};

const HistogramDrawer: React.FC<Props> = ({ post }) => {
  const t = useTranslations();
  const expandLabel = t("showMore");
  const collapseLabel = t("showLess");

  if (post.question?.type === "binary") {
    const question = post.question;

    if (!question.forecasts.histogram) {
      return null;
    }

    const histogramData = question.forecasts.histogram.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median = question.forecasts.medians.at(-1);
    const mean = question.forecasts.means.at(-1);

    return (
      <SectionToggle title={t("histogram")} defaultOpen>
        <ExpandableContent
          maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
          expandLabel={expandLabel}
          collapseLabel={collapseLabel}
          className="-mt-4"
        >
          <Histogram
            histogramData={histogramData}
            median={median}
            mean={mean}
            color={"green"}
          />
        </ExpandableContent>
      </SectionToggle>
    );
  } else if (
    post.conditional?.question_yes.type === "binary" &&
    post.conditional?.question_no.type === "binary"
  ) {
    const question_yes = post.conditional.question_yes;
    if (!question_yes.forecasts.histogram) {
      return null;
    }
    const histogramData_yes = question_yes.forecasts.histogram.map(
      (value, index) => ({
        x: index,
        y: value,
      })
    );
    const median_yes = question_yes.forecasts.medians.at(-1);
    const mean_yes = question_yes.forecasts.means.at(-1);

    const question_no = post.conditional.question_no;
    if (!question_no.forecasts.histogram) {
      return null;
    }
    const histogramData_no = question_no.forecasts.histogram.map(
      (value, index) => ({
        x: index,
        y: value,
      })
    );
    const median_no = question_no.forecasts.medians.at(-1);
    const mean_no = question_no.forecasts.means.at(-1);

    return (
      <SectionToggle title={t("histogram")} defaultOpen>
        <ExpandableContent
          maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
          expandLabel={expandLabel}
          collapseLabel={collapseLabel}
          className="-mt-4"
        >
          <div className="mb-4">
            <div className="mb-2 text-center text-xs ">
              Condition Resolves Yes
            </div>
            <Histogram
              histogramData={histogramData_yes}
              median={median_yes}
              mean={mean_yes}
              color={"green"}
            />
            <div className="mb-2 mt-4 text-center text-xs ">
              Condition Resolves No
            </div>
            <Histogram
              histogramData={histogramData_no}
              median={median_no}
              mean={mean_no}
              color={"blue"}
            />
          </div>
        </ExpandableContent>
      </SectionToggle>
    );
  }
  return null;
};

export default HistogramDrawer;
