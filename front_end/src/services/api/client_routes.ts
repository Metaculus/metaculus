import AggregationExplorerApi from "@/services/api/aggregation_explorer/aggregation_explorer.shared";
import CoherenceLinksApi from "@/services/api/coherence_links/coherence_links.shared";
import CommentsApi from "@/services/api/comments/comments.shared";
import MiscApi from "@/services/api/misc/misc.shared";
import PostsApi from "@/services/api/posts/posts.shared";
import ProfileApi from "@/services/api/profile/profile.shared";
import ProjectsApi from "@/services/api/projects/projects.shared";

// Classes behind the Client*Api instances; /api-proxy serves only their clientRoutes
export const CLIENT_APIS = [
  AggregationExplorerApi,
  CoherenceLinksApi,
  CommentsApi,
  MiscApi,
  PostsApi,
  ProfileApi,
  ProjectsApi,
];

// `:…Id` params match Django's int converter, other params its slug converter
export function routePattern(route: string): RegExp {
  const pattern = route.replace(/:(\w+)/g, (_, name: string) =>
    name.endsWith("Id") ? "\\d+" : "[-a-zA-Z0-9_]+"
  );
  return new RegExp(`^${pattern}$`);
}

const ROUTE_PATTERNS = CLIENT_APIS.flatMap((api) =>
  Object.values(api.clientRoutes).map(
    (route) => [route, routePattern(route)] as const
  )
);

export function matchClientRoute(path: string): string | undefined {
  return ROUTE_PATTERNS.find(([, pattern]) => pattern.test(path))?.[0];
}
