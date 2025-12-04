import ServerPostsApi from "@/services/api/posts/posts.server";
import { SearchParams } from "@/types/navigation";

import EmbedScreen from "../../components/embed_screen";

import "./styles.scss";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

export default async function GenerateQuestionPreview(props: {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const post = await ServerPostsApi.getPostAnonymous(params.id);
  if (!post) {
    return null;
  }
  const isOgCapture = searchParams["og"] === "1";

  if (isOgCapture) {
    return (
      <EmbedScreen
        post={post}
        targetWidth={OG_WIDTH}
        targetHeight={OG_HEIGHT}
      />
    );
  }

  return <EmbedScreen post={post} />;
}
