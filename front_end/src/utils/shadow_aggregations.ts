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
 * page rendered with another setting (another tab's, or an older one restored
 * from the back/forward cache) reloads with this tab's own. Only a focused tab
 * touches the cookie, so a background tab can't change what the foreground
 * one renders. Returns a cleanup function.
 */
export function syncTabShadowAggregations(renderedWith: boolean): () => void {
  if (getTabSetting() === null) {
    safeSessionStorage.setItem(STORAGE_KEY, String(renderedWith));
  }

  const reconcile = () => {
    const own = getTabSetting();
    if (own === null || !document.hasFocus()) return;
    // only reload if the cookie took, so blocked cookies can't loop
    if (writeCookie(own) && own !== renderedWith) {
      window.location.reload();
    }
  };
  reconcile();
  window.addEventListener("focus", reconcile);
  window.addEventListener("pageshow", reconcile);
  document.addEventListener("visibilitychange", reconcile);
  return () => {
    window.removeEventListener("focus", reconcile);
    window.removeEventListener("pageshow", reconcile);
    document.removeEventListener("visibilitychange", reconcile);
  };
}
