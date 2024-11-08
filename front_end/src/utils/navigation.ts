import { Post } from "@/types/post";
import { TournamentType } from "@/types/projects";
import { Optional } from "@/types/utils";

export function encodeQueryParams(params: Record<string, any>): string {
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
    Pick<Post, "id" | "slug" | "notebook" | "projects">,
    "notebook" | "projects"
  >
) => {
  const defaultProject = post.projects?.default_project;
  if (defaultProject?.type === TournamentType.Community) {
    return `/c/${defaultProject.slug}/${post.id}/${post.slug}/`;
  }
  if (!!post.notebook) return `/notebooks/${post.id}/${post.slug}/`;

  return `/questions/${post.id}/${post.slug}/`;
};
