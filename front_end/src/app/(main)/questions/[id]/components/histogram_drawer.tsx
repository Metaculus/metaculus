"use client";

import { useTranslations } from "next-intl";
import React from "react";

import Histogram from "@/components/charts/histogram";
import SectionToggle from "@/components/ui/section_toggle";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const HistogramDrawer: React.FC<Props> = ({ post }) => {
  const t = useTranslations();

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
        <Histogram
          histogramData={histogramData}
          median={median}
          mean={mean}
          color={"green"}
        />
      </SectionToggle>
    );
  } else if (
    post.conditional?.question_yes.type === "binary" &&
    post.conditional?.question_no.type === "binary"
  ) {
    const latest_yes =
      post.conditional.question_yes.aggregations.recency_weighted.latest;
    if (!latest_yes) {
      return null;
    }
    const histogramData_yes = latest_yes.histogram?.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median_yes = latest_yes.centers![0];
    const mean_yes = latest_yes.means![0];

    const latest_no =
      post.conditional.question_no.aggregations.recency_weighted.latest;
    if (!latest_no) {
      return null;
    }
    const histogramData_no = latest_no.histogram?.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median_no = latest_no.centers![0];
    const mean_no = latest_no.means![0];

    if (!histogramData_yes && !histogramData_no) {
      return null;
    }

    return (
      <SectionToggle title={t("histogram")}>
        {histogramData_yes && (
          <>
            <div className="mb-2 text-center text-xs">
              {t("parentResolvesAsYes")}
            </div>
            <Histogram
              histogramData={histogramData_yes}
              median={median_yes}
              mean={mean_yes}
              color="green"
            />
          </>
        )}
        {histogramData_no && (
          <>
            <div className="mb-2 text-center text-xs">
              {t("parentResolvesAsNo")}
            </div>
            <Histogram
              histogramData={histogramData_no}
              median={median_no}
              mean={mean_no}
              color="blue"
            />
          </>
        )}
      </SectionToggle>
    );
  }
};

export default HistogramDrawer;
