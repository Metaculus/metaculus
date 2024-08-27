import Link from "next/link";

import ForecastCard from "@/components/forecast_card";
import {
  EMBED_QUESTION_TITLE,
  GRAPH_ZOOM_PARAM,
  HIDE_ZOOM_PICKER,
} from "@/constants/global_search_params";
import PostsApi from "@/services/posts";
import { TimelineChartZoomOption } from "@/types/charts";
import { SearchParams } from "@/types/navigation";
import "./styles.scss";
import { PostWithForecasts } from "@/types/post";

export default async function GenerateQuestionPreview({
  params,
  searchParams,
}: {
  params: { id: number };
  searchParams: SearchParams;
}) {
  const post = await PostsApi.getPost(params.id);
  if (!post) {
    return null;
  }

  const nonInteractiveParam = searchParams["non-interactive"];

  const chartZoomParam = searchParams[GRAPH_ZOOM_PARAM];
  let chartZoom: TimelineChartZoomOption | undefined = undefined;
  if (typeof chartZoomParam === "string") {
    chartZoom =
      (chartZoomParam as TimelineChartZoomOption) ??
      TimelineChartZoomOption.TwoMonths;
  }

  const hideZoomPickerParam = searchParams[HIDE_ZOOM_PICKER];
  const embedTitle = searchParams[EMBED_QUESTION_TITLE] as string;
  return (
    <div
      className="flex size-full flex-col gap-8 bg-blue-100 p-4 text-gray-900 dark:bg-blue-100-dark dark:text-gray-900-dark xs:p-8 lg:p-14"
      id="id-used-by-screenshot-donot-change"
      style={{
        minHeight: "inherit",
      }}
    >
      <ForecastCard
        post={post}
        className="size-full flex-1 !bg-blue-100 hover:!shadow-none dark:!bg-blue-100-dark"
        chartTheme={{
          axis: { style: { tickLabels: { fontSize: 16 } } },
          line: { style: { data: { strokeWidth: 2 } } },
        }}
        nonInteractive={!!nonInteractiveParam && nonInteractiveParam === "true"}
        defaultChartZoom={chartZoom}
        withZoomPicker={hideZoomPickerParam !== "true"}
        navigateToNewTab
        embedTitle={embedTitle}
      />
      <div className="flex items-center justify-between gap-8">
        <h4 className="text-sm font-normal lg:text-2xl">
          Based on {post.forecasts_count ?? 0} predictions by{" "}
          {getForecastersNumber(post)} forecasters
        </h4>
        <Link
          href="/"
          id="id-logo-used-by-screenshot-donot-change"
          className="m-0 max-w-[250px] font-alternate-gothic text-4xl font-light tracking-[.04em] no-underline antialiased lg:text-6xl"
        >
          Metaculus
        </Link>
      </div>
    </div>
  );
}

function getForecastersNumber(post: PostWithForecasts) {
  if (post.question) {
    return (
      post.question.aggregations.recency_weighted.latest?.forecaster_count ?? 0
    );
  }

  return post.nr_forecasters ?? 0;
}
