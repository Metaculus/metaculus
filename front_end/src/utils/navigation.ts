import { SearchParams } from "@/types/navigation";
import { Notebook, Post, PostGroupOfQuestions } from "@/types/post";
import {
  Project,
  TaxonomyProjectType,
  TournamentType,
  LeaderboardTag,
} from "@/types/projects";
import { Question } from "@/types/question";
import { Optional } from "@/types/utils";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isNotebookPost,
} from "@/utils/questions/helpers";

/**
 * Converts URLSearchParams to a plain object, preserving multi-value params as arrays.
 * Unlike Object.fromEntries(), this doesn't discard duplicate keys.
 */
export function urlSearchParamsToRecord(params: URLSearchParams): SearchParams {
  const result: SearchParams = {};
  params.forEach((_, key) => {
    if (key in result) return;
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  });
  return result;
}

type EncodableValue = string | number | boolean;

export function encodeQueryParams(
  params: Record<string, EncodableValue | Array<EncodableValue>>
): string {
  const encodedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(
          (val) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
        );
      } else {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }
    })
    .join("&");

  return encodedParams ? `?${encodedParams}` : "";
}

export const addUrlParams = (
  url: string,
  params: Array<{ paramName: string; paramValue: string }>
) => {
  const urlObject = new URL(url);
  params.forEach(({ paramName, paramValue }) => {
    urlObject.searchParams.set(paramName, paramValue);
  });
  return urlObject.toString();
};

export const getPostLink = (
  post: Optional<
    Pick<Post, "id" | "slug" | "projects">,
    "slug" | "projects"
  > & {
    notebook?: Pick<Notebook, "id">;
    group_of_questions?: Pick<PostGroupOfQuestions<Question>, "id">;
  },
  questionId?: number
) => {
  const idPath = post.slug ? `${post.id}/${post.slug}` : post.id;
  let url = `/questions/${idPath}/`;
  const defaultProject = post.projects?.default_project;

  if (defaultProject?.type === TournamentType.Community) {
    url = `/c/${defaultProject.slug}/${idPath}/`;
  } else if (!!post.notebook) {
    url = `/notebooks/${idPath}/`;
  }

  // If generate links to the specific subquestion
  if (post?.group_of_questions?.id && questionId) {
    url += `?sub-question=${questionId}`;
  }

  return url;
};

export const getProjectLink = (
  project: Pick<Project, "id" | "slug"> & {
    type: TournamentType | TaxonomyProjectType;
  }
) => {
  switch (project.type) {
    case TournamentType.NewsCategory:
      return `/news/?news_type=${project.slug}`;
    case TournamentType.Community:
      return `/c/${project.slug}/`;
    case TournamentType.Index:
      return `/index/${getProjectSlug(project)}/`;
    case TaxonomyProjectType.Topic:
      return `/questions/?topic=${project.slug}&for_main_feed=false`;
    case TaxonomyProjectType.Category:
      return `/questions/?categories=${project.slug}&for_main_feed=false`;
    case TaxonomyProjectType.LeaderboardTag:
      return getLeaderboardTagUrl(project);
    default:
      return `/tournament/${getProjectSlug(project)}`;
  }
};

/**
 * Returns the correct `/leaderboard` URL for a given leaderboard tag.
 */
export function getLeaderboardTagUrl({
  slug,
}: Pick<LeaderboardTag, "slug">): string {
  // Remove the trailing “_leaderboard” flag and split the remaining string.
  const years = slug
    .replace(/_leaderboard$/, "")
    .split("_")
    .map(Number)
    .filter((n) => Number.isInteger(n));

  if (years.length === 0) {
    return "/leaderboard/";
  }

  const startYear = Math.min(...years);
  const endYear = Math.max(...years);

  const params = new URLSearchParams({
    year: String(startYear),
  });

  // If the tag spans multiple years, add an inclusive duration.
  if (years.length > 1) {
    params.set("duration", String(endYear - startYear + 1));
  }

  return `/leaderboard/?${params.toString()}`;
}

export function getLeaderboardTagFeedUrl({ slug }: LeaderboardTag) {
  return `/questions/?leaderboard_tags=${slug}&for_main_feed=false`;
}

/**
 * Builds a leaderboard tag key
 */
export function buildLeaderboardTagSlug(
  year: number,
  duration: number = 1
): string {
  if (duration < 1 || !Number.isInteger(duration)) {
    duration = 1;
  }

  return duration === 1
    ? `${year}_leaderboard`
    : `${year}_${year + duration - 1}_leaderboard`;
}

export const getProjectSlug = (project: Pick<Project, "id" | "slug">) => {
  return project.slug ?? project.id;
};

export const getWithDefaultHeader = (pathname: string): boolean =>
  !pathname.match(/^\/questions\/(\d+)(\/.*)?$/) &&
  !pathname.match(/^\/notebooks\/(\d+)(\/.*)?$/) &&
  !pathname.startsWith("/c/") &&
  !pathname.startsWith("/questions/create");

/**
 * Ensures trailing slash is handled properly, e.g. when link is defined manually in code
 *
 * Pathname extracted with `usePathname` is always expected with trailing slash
 */
export const isPathEqual = (pathname: string, href: string) => {
  return pathname.replace(/\/+$/, "") === href.replace(/\/+$/, "");
};

export const getPostEditLink = (post: Post) => {
  let edit_type = "question";

  if (isGroupOfQuestionsPost(post)) {
    edit_type = "group";
  } else if (isConditionalPost(post)) {
    edit_type = "conditional";
  } else if (isNotebookPost(post)) {
    edit_type = "notebook";
  }

  return `/questions/create/${edit_type}?post_id=${post.id}`;
};

/**
 * Ensures a safe, normalized relative redirect path.
 */
export function ensureRelativeRedirect(input: string): string {
  if (!input) return "/";

  let url = input.trim();

  if (url.startsWith("//")) {
    throw new Error(
      "Unsafe redirect URL: protocol-relative URLs are not allowed"
    );
  }

  url = url.replace(/^\/+/, "");

  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(url)) {
    throw new Error(
      "Unsafe redirect URL: absolute or protocol URLs are not allowed"
    );
  }

  // Normalize slashes
  return "/" + url;
}

export function getBulletinParamsFromPathname(pathname: string) {
  const questionMatch = pathname.match(/^\/questions\/(\d+)(?:\/|$)/);
  if (questionMatch) {
    return { post_id: Number(questionMatch[1]) };
  }

  const projectMatch = pathname.match(/^\/tournament\/([^/]+)(?:\/|$)/);
  if (projectMatch) {
    return { project_slug: projectMatch[1] };
  }

  return undefined;
}
