"use client";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import React from "react";

import SectionToggle from "@/components/ui/section_toggle";
import useContainerSize from "@/hooks/use_container_size";
import { PostWithForecasts } from "@/types/post";

import { useHideCP } from "./cp_provider";
import RevealCPButton from "./reveal_cp_button";

const Histogram = dynamic(() => import("@/components/charts/histogram"), {
  ssr: false,
});

type Props = {
  post: PostWithForecasts;
};

const HistogramDrawer: React.FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { hideCP } = useHideCP();

  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

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
        {hideCP ? (
          <RevealCPButton />
        ) : (
          <div ref={chartContainerRef}>
            <Histogram
              histogramData={histogramData}
              median={median}
              mean={mean}
              color={"gray"}
              width={chartWidth}
            />
          </div>
        )}
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
        {hideCP ? (
          <RevealCPButton />
        ) : (
          <div ref={chartContainerRef}>
            {histogramData_yes && (
              <>
                <div className="mb-2 text-center text-xs">
                  {t("parentResolvesAsYes")}
                </div>
                <Histogram
                  histogramData={histogramData_yes}
                  median={median_yes}
                  mean={mean_yes}
                  color="gray"
                  width={chartWidth}
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
                  width={chartWidth}
                />
              </>
            )}
          </div>
        )}
      </SectionToggle>
    );
  }
};

export default HistogramDrawer;
