import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentType } from "@/types/projects";

import {
  normalizeTopChromeRouteKey,
  type TopChromeHeaderConfig,
  type TopChromeHeaderState,
} from "./top_chrome_header_shared";

// IMPORTANT: this file only seeds the top chrome header for the initial SSR
// request. If a page needs a special header, it must also render
// TopChromeHeaderSetter so client-side navigation into that page updates the
// header after the parent layout has already mounted.

const getPost = cache((postId: number) => ServerPostsApi.getPost(postId));

const getCommunityBySlug = cache((slug: string) =>
  ServerProjectsApi.getCommunity(slug)
);

const getCommunityById = cache(async (communityId: number) => {
  const communitiesResponse = await ServerProjectsApi.getCommunities({
    ids: [communityId],
  });

  return communitiesResponse.results[0] ?? null;
});

const parsePositiveInteger = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const getCommunityHeaderFromPost = async (
  postId: number
): Promise<TopChromeHeaderConfig | null> => {
  try {
    const post = await getPost(postId);
    const defaultProject = post.projects?.default_project;

    if (
      defaultProject?.type !== TournamentType.Community ||
      !defaultProject.slug
    ) {
      return null;
    }

    const community = await getCommunityBySlug(defaultProject.slug);

    return { type: "community", community };
  } catch {
    return null;
  }
};

const getCommunityHeaderFromSlug = async (
  slug: string,
  alwaysShowName?: boolean
): Promise<TopChromeHeaderConfig | null> => {
  try {
    const community = await getCommunityBySlug(slug);

    return { type: "community", community, alwaysShowName };
  } catch {
    return null;
  }
};

const getCommunityHeaderFromCreateUrl = async (
  url: URL
): Promise<TopChromeHeaderConfig | null> => {
  const communityId = parsePositiveInteger(
    url.searchParams.get("community_id")
  );

  if (!communityId) {
    return null;
  }

  try {
    const community = await getCommunityById(communityId);

    return community ? { type: "community", community } : null;
  } catch {
    return null;
  }
};

const resolveTopChromeHeaderConfig = async (
  url: URL
): Promise<TopChromeHeaderConfig | null> => {
  const pathname = normalizeTopChromeRouteKey(url.pathname);
  const segments = pathname.split("/").filter(Boolean);
  const [rootSegment, secondSegment, thirdSegment] = segments;

  // Community URLs:
  // - /c/:slug should show the community header without forcing the name.
  // - /c/:slug/settings should show the community header with the name.
  // - /c/:slug/:postId/... resolves from the post so mismatched slugs do not
  //   seed the wrong header.
  if (rootSegment === "c" && secondSegment) {
    const postId = parsePositiveInteger(thirdSegment);

    if (postId) {
      return getCommunityHeaderFromPost(postId);
    }

    return getCommunityHeaderFromSlug(secondSegment, segments.length !== 2);
  }

  // Creation URLs can be community-scoped by query string:
  // /questions/create?community_id=:id and
  // /questions/create/:content_type?community_id=:id
  if (rootSegment === "questions" && secondSegment === "create") {
    return getCommunityHeaderFromCreateUrl(url);
  }

  // Canonical post URLs seed a community header only when the post's default
  // project is a community. Normal tournament/site-main posts keep the default
  // header by returning null.
  if (rootSegment === "questions" || rootSegment === "notebooks") {
    const postId = parsePositiveInteger(secondSegment);

    return postId ? getCommunityHeaderFromPost(postId) : null;
  }

  return null;
};

export const resolveInitialTopChromeHeaderState =
  async (): Promise<TopChromeHeaderState | null> => {
    const headersList = await headers();
    const requestUrl = headersList.get("x-url");

    if (!requestUrl) {
      return null;
    }

    try {
      const url = new URL(requestUrl);
      const header = await resolveTopChromeHeaderConfig(url);

      // Null intentionally means "use the normal header". The client provider
      // still scopes any seeded special header to this exact pathname, so
      // client navigation away from it naturally reverts to the default header.
      return header
        ? {
            routeKey: normalizeTopChromeRouteKey(url.pathname),
            header,
          }
        : null;
    } catch {
      return null;
    }
  };
