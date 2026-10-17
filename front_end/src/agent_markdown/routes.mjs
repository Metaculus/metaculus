/**
 * Every markdown-enabled page type, declared once: add an entry here and a
 * co-located `markdown.ts` builder. `pattern` is a restricted path-to-regexp
 * subset — literals, `:name`, `:name(regex)`, and one trailing `:name?`.
 *
 * Plain JS so next.config.mjs, which Node loads raw, can import it.
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
 * Params travel as path segments because a rewrite's destination query string
 * is not readable from a Route Handler.
 *
 * @param {Record<string, { pattern: string }>} [routes]
 * @returns {MarkdownRewrite[]}
 */
export function buildMarkdownRewrites(routes = MARKDOWN_ROUTES) {
  return Object.entries(routes).flatMap(([type, { pattern }]) =>
    expandOptional(pattern).map((segments) => ({
      // trailingSlash: true, so the matched request always carries one
      source: `/${segments.join("/")}/`,
      has: [ACCEPT_MARKDOWN],
      destination: `/md/${type}/${segments
        .filter((segment) => PARAM_SYNTAX.test(segment))
        .map((segment) => `:${PARAM_SYNTAX.exec(segment)?.[1]}`)
        .join("/")}/`,
    }))
  );
}
