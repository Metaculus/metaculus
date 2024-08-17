"use client";

import { useTranslations } from "next-intl";
import React from "react";

import Histogram from "@/app/(main)/charts/histogram";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { PostWithForecasts } from "@/types/post";

const MAX_COLLAPSED_HEIGHT = 256;

type Props = {
  post: PostWithForecasts;
};

const HistogramDrawer: React.FC<Props> = ({ post }) => {
  const t = useTranslations();
  const expandLabel = t("showMore");
  const collapseLabel = t("showLess");

  if (post.question?.type === "binary") {
    const question = post.question;

    if (!question.aggregations.recency_weighted.latest?.histogram) {
      return null;
    }
    const histogramData =
      question.aggregations.recency_weighted.latest.histogram.map(
        (value, index) => ({
          x: index,
          y: value,
        })
      );
    const median = question.aggregations.recency_weighted.latest.centers![0];
    const mean = question.aggregations.recency_weighted.latest.means![0];

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
    const latest_yes =
      post.conditional.question_yes.aggregations.recency_weighted.latest;
    if (!latest_yes?.histogram) {
      return null;
    }
    const histogramData_yes = latest_yes!.histogram!.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median_yes = latest_yes!.centers![0];
    const mean_yes = latest_yes!.means![0];

    const latest_no =
      post.conditional.question_no.aggregations.recency_weighted.latest;
    if (!latest_no?.histogram) {
      return null;
    }
    const histogramData_no = latest_no!.histogram!.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median_no = latest_no!.centers![0];
    const mean_no = latest_no!.means![0];

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
