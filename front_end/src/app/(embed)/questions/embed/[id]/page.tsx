import { EMBED_QUESTION_TITLE } from "@/constants/global_search_params";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { SearchParams } from "@/types/navigation";

import EmbedScreen from "../../components/embed_screen";
import { getEmbedTheme } from "../../helpers/embed_theme";

import "./styles.scss";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

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

  const commonProps = {
    post,
    theme: embedTheme,
    titleOverride,
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
