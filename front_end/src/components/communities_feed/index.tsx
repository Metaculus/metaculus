import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import ServerProfileApi from "@/services/api/profile/profile.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";

import PaginatedCommunitiesFeed from "./paginated_communities_feed";

const AwaitedCommunitiesFeed: FC = async () => {
  const user = await ServerProfileApi.getMyProfile();
  const requests = [
    ServerProjectsApi.getCommunities({
      limit: POSTS_PER_PAGE,
      is_subscribed: false,
    }),
    ...(user
      ? [
          ServerProjectsApi.getCommunities({
            is_subscribed: true,
          }),
        ]
      : []),
  ] as const;

  const [{ results: initialCommunities }, followedCommunitiesResponse] =
    await Promise.all(requests);
  const followedCommunities = user
    ? followedCommunitiesResponse?.results ?? []
    : [];
  return (
    <PaginatedCommunitiesFeed
      followedCommunities={user ? followedCommunities : []}
      initialCommunities={initialCommunities}
    />
  );
};

export default WithServerComponentErrorBoundary(AwaitedCommunitiesFeed);
