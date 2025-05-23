import Link from "next/link";
import { getTranslations } from "next-intl/server";

import ForecastCard from "@/components/forecast_card";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import {
  EMBED_QUESTION_TITLE,
  GRAPH_ZOOM_PARAM,
  HIDE_ZOOM_PICKER,
} from "@/constants/global_search_params";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { TimelineChartZoomOption } from "@/types/charts";
import { SearchParams } from "@/types/navigation";
import "./styles.scss";
import { TournamentType } from "@/types/projects";

import { getEmbedTheme } from "../../helpers/embed_theme";

export default async function GenerateQuestionPreview(props: {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const t = await getTranslations();
  const post = await ServerPostsApi.getPostAnonymous(params.id);
  if (!post) {
    return null;
  }
  const isCommunityQuestion =
    post.projects.default_project.type === TournamentType.Community;

  const embedTheme = getEmbedTheme(
    searchParams["embed_theme"],
    searchParams["css_variables"]
  );

  const nonInteractiveParam = searchParams["non-interactive"];

  const chartZoomParam = searchParams[GRAPH_ZOOM_PARAM];
  let chartZoom: TimelineChartZoomOption | undefined = undefined;
  if (typeof chartZoomParam === "string") {
    chartZoom =
      (chartZoomParam as TimelineChartZoomOption) ??
      TimelineChartZoomOption.TwoMonths;
  }

  const hideZoomPickerParam = searchParams[HIDE_ZOOM_PICKER];
  const embedTitle = searchParams[EMBED_QUESTION_TITLE] as string | undefined;
  return (
    <div
      className="flex size-full flex-col gap-8 bg-blue-100 p-4 text-gray-900 dark:bg-blue-100-dark dark:text-gray-900-dark xs:p-8 lg:p-14"
      id="id-used-by-screenshot-donot-change"
      style={{
        minHeight: "inherit",
        ...embedTheme.card,
      }}
    >
      {isCommunityQuestion && (
        <CommunityDisclaimer
          project={post.projects.default_project}
          variant="standalone"
          className="-mb-2"
        />
      )}
      <ForecastCard
        post={post}
        className="size-full flex-1 bg-transparent hover:shadow-none dark:bg-transparent"
        embedTheme={embedTheme}
        nonInteractive={!!nonInteractiveParam && nonInteractiveParam === "true"}
        defaultChartZoom={chartZoom}
        withZoomPicker={hideZoomPickerParam !== "true"}
        navigateToNewTab
        embedTitle={embedTitle}
      />
      <div className="flex items-center justify-between gap-8">
        <h4 className="text-sm font-normal lg:text-2xl">
          {t("forecastDisclaimer", {
            predictionCount: post.forecasts_count ?? 0,
            forecasterCount: post.nr_forecasters,
          })}
        </h4>
        <Link
          href="/"
          id="id-logo-used-by-screenshot-donot-change"
          className="m-0 max-w-64 font-league-gothic text-4xl font-light capitalize tracking-wider no-underline antialiased lg:text-6xl"
        >
          {t("metaculus")}
        </Link>
      </div>
    </div>
  );
}
