export const BULLETINS_STALE_TIME = 60 * 1000;
export const BULLETINS_QUERY_KEY = ["bulletins"] as const;

export const DISMISSED_BULLETINS_COOKIE = "dismissed_bulletins";

const MAX_DISMISSED_BULLETIN_IDS = 10;

const isPositiveInteger = (id: number) => Number.isInteger(id) && id > 0;

export const parseDismissedBulletinIds = (value?: string | null): number[] => {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(",")
        .filter((id) => /^\d+$/.test(id))
        .map((id) => Number(id))
        .filter(isPositiveInteger)
    ),
  ];
};

export const serializeDismissedBulletinIds = (ids: Iterable<number>) =>
  [...new Set(ids)]
    .filter(isPositiveInteger)
    .slice(-MAX_DISMISSED_BULLETIN_IDS)
    .join(",");
