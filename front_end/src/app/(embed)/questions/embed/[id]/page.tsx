import { EMBED_QUESTION_TITLE } from "@/constants/global_search_params";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { SearchParams } from "@/types/navigation";

import EmbedScreen from "../../components/embed_screen";
import { getEmbedTheme } from "../../helpers/embed_theme";

import "./styles.scss";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MIN_EMBED_WIDTH = 360;
const MIN_EMBED_HEIGHT = 200;
const MAX_EMBED_WIDTH = 1200;
const MAX_EMBED_HEIGHT = 800;

function parseIntParam(
  value: string | undefined,
  min?: number,
  max?: number
): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) return undefined;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
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

  const isOgCapture = searchParams["og"] === "1";

  // Custom dimensions (consumer handles responsive logic)
  // Both width and height must be provided for custom sizing to take effect
  const width = parseIntParam(
    searchParams["width"] as string,
    MIN_EMBED_WIDTH,
    MAX_EMBED_WIDTH
  );
  const height = parseIntParam(
    searchParams["height"] as string,
    MIN_EMBED_HEIGHT,
    MAX_EMBED_HEIGHT
  );

  const commonProps = {
    post,
    theme: embedTheme,
    titleOverride,
    customWidth: width,
    customHeight: height,
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
