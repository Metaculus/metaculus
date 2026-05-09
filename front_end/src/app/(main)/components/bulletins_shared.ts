export const BULLETINS_STALE_TIME = 60 * 1000;
export const BULLETINS_QUERY_KEY = ["bulletins"] as const;

export const DISMISSED_BULLETINS_COOKIE = "dismissed_bulletins";

const MAX_DISMISSED_BULLETIN_IDS = 10;

export const parseDismissedBulletinIds = (value?: string | null): number[] => {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(",")
        .map((id) => Number.parseInt(id, 10))
        .filter(Number.isFinite)
    ),
  ];
};

export const serializeDismissedBulletinIds = (ids: Iterable<number>) =>
  [...new Set(ids)]
    .filter(Number.isFinite)
    .slice(-MAX_DISMISSED_BULLETIN_IDS)
    .join(",");
