import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";

import PaginatedCommunitiesFeed from "./paginated_communities_feed";

const AwaitedCommunitiesFeed: FC = async () => {
  const user = await ProfileApi.getMyProfile();
  const requests = [
    ProjectsApi.getCommunities({
      limit: POSTS_PER_PAGE,
      is_subscribed: false,
    }),
  ];

  if (user) {
    requests.push(
      ProjectsApi.getCommunities({
        is_subscribed: true,
      })
    );
  }

  const [{ results: initialCommunities }, followedCommunitiesResponse] =
    await Promise.all(requests);
  const followedCommunities = user ? followedCommunitiesResponse.results : [];
  return (
    <PaginatedCommunitiesFeed
      followedCommunities={user ? followedCommunities : []}
      initialCommunities={initialCommunities}
    />
  );
};

export default WithServerComponentErrorBoundary(AwaitedCommunitiesFeed);
