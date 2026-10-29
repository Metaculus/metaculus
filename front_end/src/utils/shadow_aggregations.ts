// Per-tab setting for the staff-only shadow aggregation view, so two tabs can
// show different aggregates. Temporary: remove this file with the banner
// (app/(main)/components/shadow_aggregations_banner_*), the SHADOW_AGGREGATIONS_*
// constants and their uses in fetch.client.ts, fetch.server.ts and api-proxy.
//
// Each tab keeps its setting in sessionStorage. Client API calls send it as a
// header. Server renders can only read cookies, which every tab shares, so a
// tab copies its setting into the cookie whenever it gains focus: the tab
// being used is the one whose setting the cookie holds.
import {
  SHADOW_AGGREGATIONS_COOKIE,
  SHADOW_AGGREGATIONS_HEADER,
} from "@/constants/questions";
import { safeDocumentCookie, safeSessionStorage } from "@/utils/core/storage";

const STORAGE_KEY = SHADOW_AGGREGATIONS_COOKIE;

/** This tab's setting, null until it has one */
function getTabSetting(): boolean | null {
  const value = safeSessionStorage.getItem(STORAGE_KEY);
  return value === null ? null : value === "true";
}

function writeCookie(enabled: boolean): boolean {
  // A session cookie, so it doesn't outlast the browser session
  safeDocumentCookie.set(SHADOW_AGGREGATIONS_COOKIE, String(enabled));
  return safeDocumentCookie.get(SHADOW_AGGREGATIONS_COOKIE) === String(enabled);
}

/** Sets this tab's setting (and the cookie, for its server renders) */
export function setTabShadowAggregations(enabled: boolean): void {
  safeSessionStorage.setItem(STORAGE_KEY, String(enabled));
  writeCookie(enabled);
}

/** The header carrying this tab's setting on client API calls */
export function shadowAggregationsHeaders(): Record<string, string> {
  const enabled = getTabSetting();
  return enabled === null
    ? {}
    : { [SHADOW_AGGREGATIONS_HEADER]: String(enabled) };
}

/**
 * Keeps the cookie on this tab's setting while it has focus. `renderedWith` is
 * the setting this page was server-rendered with: a new tab adopts it, and a
 * tab whose page was rendered with another tab's setting reloads with its
 * own. Returns a cleanup function.
 */
export function syncTabShadowAggregations(renderedWith: boolean): () => void {
  const own = getTabSetting();
  if (own === null) {
    safeSessionStorage.setItem(STORAGE_KEY, String(renderedWith));
  } else if (own !== renderedWith && writeCookie(own)) {
    // only if the cookie took, so blocked cookies can't loop
    window.location.reload();
  }

  const onFocus = () => {
    const enabled = getTabSetting();
    if (enabled !== null && document.visibilityState === "visible") {
      writeCookie(enabled);
    }
  };
  window.addEventListener("focus", onFocus);
  window.addEventListener("pageshow", onFocus);
  document.addEventListener("visibilitychange", onFocus);
  return () => {
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("pageshow", onFocus);
    document.removeEventListener("visibilitychange", onFocus);
  };
}
