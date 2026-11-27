type RouteParam<Route extends string> =
  Route extends `${string}:${infer Param}/${infer Rest}`
    ? Param | RouteParam<Rest>
    : never;

type RouteParams<Route extends string> = [RouteParam<Route>] extends [never]
  ? []
  : [Record<RouteParam<Route>, string | number>];

export function clientPath<Route extends string>(
  route: Route,
  ...[params]: RouteParams<Route>
): string {
  return route.replace(/:(\w+)/g, (_, name: string) =>
    encodeURIComponent(
      String((params as Record<string, string | number>)[name])
    )
  );
}
