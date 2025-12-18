import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
import CommentFeed from "@/components/comment_feed";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";

type Props = {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
};

export default async function Comments(props: Props) {
  const params = await props.params;
  const profile = await ServerProfileApi.getProfileById(params.id);

  return (
    <div className="flex flex-col rounded bg-white px-4 py-1 dark:bg-blue-900 md:px-6 md:py-2">
      <CommentsFeedProvider profileId={profile.id} rootCommentStructure={false}>
        <CommentFeed profileId={profile.id} rootCommentStructure={false} />
      </CommentsFeedProvider>
    </div>
  );
}
