import {
  GRAPH_ZOOM_PARAM,
  HIDE_ZOOM_PICKER,
  EMBED_QUESTION_TITLE,
} from "@/constants/global_search_params";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { TimelineChartZoomOption } from "@/types/charts";
import { SearchParams } from "@/types/navigation";

import EmbedScreen from "../../components/embed_screen";
import { getEmbedTheme } from "../../helpers/embed_theme";

import "./styles.scss";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function parseDefaultZoom(
  searchParams: SearchParams
): TimelineChartZoomOption | undefined {
  const raw = searchParams[GRAPH_ZOOM_PARAM];
  if (typeof raw !== "string") return undefined;
  return (raw as TimelineChartZoomOption) ?? TimelineChartZoomOption.TwoMonths;
}

function parseWithZoomPicker(searchParams: SearchParams): boolean {
  return searchParams[HIDE_ZOOM_PICKER] !== "true";
}

export default async function GenerateQuestionPreview(props: {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
}) {
  const [searchParams, params] = await Promise.all([
    props.searchParams,
    props.params,
  ]);

  const post = await ServerPostsApi.getPostAnonymous(params.id);
  if (!post) return null;

  const embedTheme = getEmbedTheme(
    searchParams["embed_theme"],
    searchParams["css_variables"]
  );

  const titleOverride = searchParams[EMBED_QUESTION_TITLE] as
    | string
    | undefined;

  const defaultZoom = parseDefaultZoom(searchParams);
  const withZoomPicker = parseWithZoomPicker(searchParams);

  const isOgCapture = searchParams["og"] === "1";

  const commonProps = {
    post,
    theme: embedTheme,
    titleOverride,
    defaultZoom,
    withZoomPicker,
  };

  return isOgCapture ? (
    <EmbedScreen
      {...commonProps}
      targetWidth={OG_WIDTH}
      targetHeight={OG_HEIGHT}
    />
  ) : (
    <EmbedScreen {...commonProps} />
  );
}
