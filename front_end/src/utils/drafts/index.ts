import { logError } from "../core/errors";

const BYTES_IN_MB = 1024 * 1024;

export function cleanupDrafts({
  maxAgeDays = 14,
  maxSizeMB,
  keyPrefix,
}: {
  maxSizeMB: number;
  keyPrefix: string;
  maxAgeDays?: number;
}): void {
  try {
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    const drafts = Object.keys(localStorage)
      .filter((key) => key.startsWith(keyPrefix))
      .map((key) => {
        try {
          const item = localStorage.getItem(key) || "";
          const draft = JSON.parse(item);
          return {
            key,
            lastModified: draft.lastModified,
            size: new Blob([item]).size,
          };
        } catch {
          return {
            key,
            lastModified: 0,
            size: 0,
          };
        }
      })
      .sort((a, b) => a.lastModified - b.lastModified);
    let totalSizeMB =
      drafts.reduce((acc, draft) => acc + draft.size, 0) / BYTES_IN_MB;

    // Delete drafts if they're older than maxAge
    // Or if total size exceeds MAX_DRAFT_SIZE_MB - delete oldest ones until we're under limit
    drafts.forEach((draft) => {
      const shouldDeleteDueToAge = now - draft.lastModified >= maxAge;
      const shouldDeleteDueToSize = totalSizeMB > maxSizeMB;

      if (shouldDeleteDueToAge || shouldDeleteDueToSize) {
        try {
          localStorage.removeItem(draft.key);
          totalSizeMB -= draft.size / BYTES_IN_MB;
        } catch (error) {
          logError(error, { message: `Failed to remove draft: ${draft.key}` });
        }
      }
    });
  } catch (error) {
    logError(error, { message: "Failed to cleanup old drafts" });
  }
}
