"use client";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import React from "react";

import SectionToggle from "@/components/ui/section_toggle";
import { useHideCP } from "@/contexts/cp_context";
import useContainerSize from "@/hooks/use_container_size";
import { PostWithForecasts } from "@/types/post";

import RevealCPButton from "./reveal_cp_button";

const Histogram = dynamic(() => import("@/components/charts/histogram"), {
  ssr: false,
});
const toggleSectionPadding = 24;

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

    const histogram =
      question.aggregations.recency_weighted.latest?.histogram?.at(0);
    if (!histogram?.length) {
      return null;
    }
    const histogramData = histogram.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median =
      question?.aggregations?.recency_weighted?.latest?.centers?.[0];
    const mean = question?.aggregations?.recency_weighted?.latest?.means?.[0];

    return (
      <div ref={chartContainerRef}>
        <SectionToggle title={t("histogram")} defaultOpen>
          {hideCP ? (
            <RevealCPButton />
          ) : (
            <Histogram
              histogramData={histogramData}
              median={median}
              mean={mean}
              color={"gray"}
              width={chartWidth - toggleSectionPadding}
            />
          )}
        </SectionToggle>
      </div>
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
    const histogramData_yes = latest_yes.histogram
      ?.at(0)
      ?.map((value, index) => ({
        x: index,
        y: value,
      }));
    const median_yes = latest_yes.centers?.[0];
    const mean_yes = latest_yes.means?.[0];

    const latest_no =
      post.conditional.question_no.aggregations.recency_weighted.latest;
    if (!latest_no) {
      return null;
    }
    const histogramData_no = latest_no.histogram
      ?.at(0)
      ?.map((value, index) => ({
        x: index,
        y: value,
      }));
    const median_no = latest_no.centers?.[0];
    const mean_no = latest_no.means?.[0];

    if (!histogramData_yes && !histogramData_no) {
      return null;
    }

    return (
      <div ref={chartContainerRef}>
        <SectionToggle title={t("histogram")}>
          {hideCP ? (
            <RevealCPButton />
          ) : (
            <>
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
                    width={chartWidth - toggleSectionPadding}
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
                    width={chartWidth - toggleSectionPadding}
                  />
                </>
              )}
            </>
          )}
        </SectionToggle>
      </div>
    );
  }
};

export default HistogramDrawer;
