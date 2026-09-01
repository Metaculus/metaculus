import {
  EmailCapturePendingRecord,
  SocialGatedActionStash,
} from "@/types/gated_actions";
import { safeLocalStorage, safeSessionStorage } from "@/utils/core/storage";

// Matches the backend link TTL (AUTH_EMAIL_LINK_TIMEOUT, 24h default). An
// older record means every link it produced is dead, so it reads as absent.
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_KEY = "emailCapturePending:v1";
const CHANGE_EVENT = "emailCapturePendingChange";

const SOCIAL_STASH_KEY = "socialGatedAction:v1";
const SOCIAL_STASH_TTL_MS = 15 * 60 * 1000;

// The banner (TopChrome) and the drawer (GlobalModals) live in separate trees,
// so the record is exposed through a useSyncExternalStore-compatible store: a
// custom event syncs same-tab writes, the native "storage" event other tabs.
let cachedRaw: string | null | undefined;
let cachedRecord: EmailCapturePendingRecord | null = null;

const parseRecord = (raw: string | null): EmailCapturePendingRecord | null => {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as EmailCapturePendingRecord;
    if (
      typeof record?.email !== "string" ||
      typeof record?.sentAt !== "number" ||
      Date.now() - record.sentAt > PENDING_TTL_MS
    ) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
};

export const readPending = (): EmailCapturePendingRecord | null => {
  const raw = safeLocalStorage.getItem(PENDING_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedRecord = parseRecord(raw);
  }
  // Expiry check must run on every read, not only on raw changes
  if (cachedRecord && Date.now() - cachedRecord.sentAt > PENDING_TTL_MS) {
    cachedRecord = null;
  }
  return cachedRecord;
};

const notifyChange = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const writePending = (record: EmailCapturePendingRecord) => {
  safeLocalStorage.setItem(PENDING_KEY, JSON.stringify(record));
  notifyChange();
};

export const clearPending = () => {
  safeLocalStorage.removeItem(PENDING_KEY);
  notifyChange();
};

export const subscribePending = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

// The Google path is a full-page OAuth redirect: the action is stashed in
// sessionStorage before leaving and attached to the code exchange on return.
export const stashSocialGatedAction = (
  stash: Omit<SocialGatedActionStash, "stashedAt">
) => {
  // Losing the stash only means the user redoes the tap after OAuth
  safeSessionStorage.setItem(
    SOCIAL_STASH_KEY,
    JSON.stringify({ ...stash, stashedAt: Date.now() })
  );
};

export const takeSocialGatedAction = (): SocialGatedActionStash | null => {
  const raw = safeSessionStorage.getItem(SOCIAL_STASH_KEY);
  safeSessionStorage.removeItem(SOCIAL_STASH_KEY);
  if (!raw) return null;
  try {
    const stash = JSON.parse(raw) as SocialGatedActionStash;
    if (
      !stash?.trigger ||
      typeof stash.stashedAt !== "number" ||
      Date.now() - stash.stashedAt > SOCIAL_STASH_TTL_MS
    ) {
      return null;
    }
    return stash;
  } catch {
    return null;
  }
};
