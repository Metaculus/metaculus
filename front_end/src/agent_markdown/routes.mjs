/**
 * Every markdown-enabled page type is declared here once. `next.config.mjs`
 * reads `pattern` to generate rewrites; the `/md/[type]` route handler calls
 * `load` to get the builder, and derives its param names from the same
 * pattern. Plain JS because next.config is loaded raw by Node and cannot
 * import TypeScript — `load` is never executed there, so its specifier is
 * only resolved when the app bundles this module.
 *
 * Adding a page type: one entry here, one co-located `markdown.ts` builder.
 *
 * `pattern` is a restricted path-to-regexp subset: literals, `:name`,
 * `:name(regex)`, and a single optional `:name?` in the final position.
 */
export const MARKDOWN_ROUTES = {
  notebook: {
    pattern: "/notebooks/:id(\\d+)/:slug?",
    load: () => import("../app/(main)/notebooks/[id]/[[...slug]]/markdown"),
  },
};

const ACCEPT_MARKDOWN = {
  type: "header",
  key: "accept",
  value: ".*text/markdown.*",
};

const PARAM_SYNTAX = /^:([A-Za-z][A-Za-z0-9_]*)(?:\(([^)]+)\))?(\?)?$/;

export function routeParamNames(pattern) {
  return pattern
    .split("/")
    .map((segment) => PARAM_SYNTAX.exec(segment)?.[1])
    .filter((name) => !!name);
}

export function getMarkdownRoute(type) {
  // hasOwn, so a type like `constructor` cannot reach Object.prototype
  return Object.hasOwn(MARKDOWN_ROUTES, type)
    ? MARKDOWN_ROUTES[type]
    : undefined;
}

/** Zip the positional URL segments onto the pattern's param names. */
export function toRouteParams(route, args) {
  return Object.fromEntries(
    routeParamNames(route.pattern).map((name, index) => [name, args[index]])
  );
}

/** `/a/:b?` -> [`/a`, `/a/:b`] so each arity gets a concrete rewrite. */
function expandOptional(pattern) {
  const segments = pattern.split("/").filter(Boolean);
  const last = segments.at(-1);
  const param = last ? PARAM_SYNTAX.exec(last) : null;

  if (!param?.[3]) return [segments];

  const [, name, source] = param;
  const head = segments.slice(0, -1);

  return [head, [...head, source ? `:${name}(${source})` : `:${name}`]];
}

/**
 * @typedef {{ type: string, key: string, value?: string }} RewriteCondition
 * @typedef {{ source: string, destination: string, has?: RewriteCondition[] }} MarkdownRewrite
 */

/**
 * Content negotiation on the canonical URL. Params travel as path segments
 * because a rewrite's destination query string is not readable from a Route
 * Handler — `request.nextUrl` there still reports the original URL.
 *
 * @param {Record<string, { pattern: string }>} [routes]
 * @returns {MarkdownRewrite[]}
 */
export function buildMarkdownRewrites(routes = MARKDOWN_ROUTES) {
  return Object.entries(routes).flatMap(([type, { pattern }]) =>
    expandOptional(pattern).map((segments) => ({
      // trailingSlash: true means the matched request always carries it
      source: `/${segments.join("/")}/`,
      has: [ACCEPT_MARKDOWN],
      destination: `/md/${type}/${segments
        .filter((segment) => PARAM_SYNTAX.test(segment))
        .map((segment) => `:${PARAM_SYNTAX.exec(segment)?.[1]}`)
        .join("/")}/`,
    }))
  );
}
