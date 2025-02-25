import { Post } from "@/types/post";
import { Project, TournamentType } from "@/types/projects";
import { Question } from "@/types/question";
import { Optional } from "@/types/utils";

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
    Pick<Post, "id" | "slug" | "notebook" | "projects" | "group_of_questions">,
    "notebook" | "projects" | "group_of_questions"
  >,
  questionId?: number
) => {
  let url = `/questions/${post.id}/${post.slug}/`;
  const defaultProject = post.projects?.default_project;

  if (defaultProject?.type === TournamentType.Community) {
    url = `/c/${defaultProject.slug}/${post.id}/${post.slug}/`;
  } else if (!!post.notebook) {
    url = `/notebooks/${post.id}/${post.slug}/`;
  }

  // If generate links to the specific subquestion
  if (post?.group_of_questions?.questions.length && questionId) {
    url += `?sub-question=${questionId}`;
  }

  return url;
};

export const getProjectLink = (project: Project) => {
  switch (project.type) {
    case TournamentType.NewsCategory:
      return `/news/?news_type=${project.slug}`;
    case TournamentType.Community:
      return `/c/${project.slug}/`;
    default:
      return `/tournament/${project.slug ?? project.id}`;
  }
};

export const getWithDefaultHeader = (pathname: string): boolean =>
  !pathname.match(/^\/questions\/(\d+)(\/.*)?$/) &&
  !pathname.match(/^\/notebooks\/(\d+)(\/.*)?$/) &&
  !pathname.startsWith("/c/") &&
  !pathname.startsWith("/questions/create");
