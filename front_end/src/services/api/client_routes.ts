// Paths the browser requests through /api-proxy; the proxy serves nothing else
export const CLIENT_ROUTES = {
  adTiles: "/ad-tiles/",
  aggregationExplorer: "/aggregation_explorer/",
  bulletins: "/get-bulletins/",
  coherenceAggregateLinks: "/coherence/question/:questionId/aggregate-links/",
  coherenceLinks: "/coherence/question/:questionId/links/",
  comment: "/comments/:commentId/",
  comments: "/comments/",
  commentsOfWeek: "/comments/comments-of-week/",
  communities: "/projects/communities/",
  forecastFlowPosts: "/projects/tournaments/:slug/forecast-flow-posts/",
  onboardingFeed: "/posts/onboarding-feed/",
  post: "/posts/:postId/",
  postNewsHotness: "/posts/:postId/news-hotness/",
  postRelatedArticles: "/posts/:postId/related-articles/",
  posts: "/posts/",
  privateNotes: "/posts/private-notes/",
  question: "/questions/:questionId/",
  randomPost: "/posts/random/",
  similarPosts: "/posts/:postId/similar-posts/",
  siteMain: "/projects/site_main/",
  suggestedKeyFactors: "/comments/:commentId/suggested-key-factors/",
  tournaments: "/projects/tournaments/",
  users: "/users/",
} as const;

export type ClientRoute = (typeof CLIENT_ROUTES)[keyof typeof CLIENT_ROUTES];

type RouteParam<Route extends string> =
  Route extends `${string}:${infer Param}/${infer Rest}`
    ? Param | RouteParam<Rest>
    : never;

type RouteParams<Route extends string> = [RouteParam<Route>] extends [never]
  ? []
  : [Record<RouteParam<Route>, string | number>];

export function clientPath<Route extends ClientRoute>(
  route: Route,
  ...[params]: RouteParams<Route>
): string {
  return route.replace(/:(\w+)/g, (_, name: string) =>
    encodeURIComponent(
      String((params as Record<string, string | number>)[name])
    )
  );
}

// `:…Id` params match Django's int converter, other params its slug converter
const paramPattern = (name: string) =>
  name.endsWith("Id") ? "\\d+" : "[-a-zA-Z0-9_]+";

const ROUTE_PATTERNS = Object.values(CLIENT_ROUTES).map(
  (route) =>
    [
      route,
      new RegExp(
        `^${route.replace(/:(\w+)/g, (_, name: string) => paramPattern(name))}$`
      ),
    ] as const
);

export function matchClientRoute(path: string): ClientRoute | undefined {
  return ROUTE_PATTERNS.find(([, pattern]) => pattern.test(path))?.[0];
}
