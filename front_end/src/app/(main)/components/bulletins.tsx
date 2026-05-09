import { cookies } from "next/headers";

import ServerMiscApi from "@/services/api/misc/misc.server";
import type { BulletinItem } from "@/services/api/misc/misc.shared";
import { AuthCookieReader } from "@/services/auth_tokens";
import { logError } from "@/utils/core/errors";

import BulletinsClient from "./bulletins_client";
import {
  DISMISSED_BULLETINS_COOKIE,
  parseDismissedBulletinIds,
} from "./bulletins_shared";

const getInitialBulletins = async (): Promise<BulletinItem[]> => {
  try {
    return await ServerMiscApi.getBulletins();
  } catch (error) {
    logError(error);
    return [];
  }
};

const getInitialDismissedBulletinIds = async (): Promise<number[]> => {
  try {
    return await ServerMiscApi.getDismissedBulletinIds();
  } catch (error) {
    logError(error);
    return [];
  }
};

const mergeBulletinIds = (...idGroups: number[][]) => [
  ...new Set(idGroups.flat()),
];

const Bulletins = async () => {
  const initialBulletinsPromise = getInitialBulletins();
  const cookieStore = await cookies();
  const cookieDismissedBulletinIds = parseDismissedBulletinIds(
    cookieStore.get(DISMISSED_BULLETINS_COOKIE)?.value
  );
  const authenticatedDismissedBulletinIdsPromise = new AuthCookieReader(
    cookieStore
  ).hasAuthSession()
    ? getInitialDismissedBulletinIds()
    : Promise.resolve([]);

  const [initialBulletins, authenticatedDismissedBulletinIds] =
    await Promise.all([
      initialBulletinsPromise,
      authenticatedDismissedBulletinIdsPromise,
    ]);
  const initialDismissedBulletinIds = mergeBulletinIds(
    authenticatedDismissedBulletinIds,
    cookieDismissedBulletinIds
  );

  return (
    <BulletinsClient
      initialBulletins={initialBulletins}
      initialDismissedBulletinIds={initialDismissedBulletinIds}
      initialSyncedDismissedBulletinIds={authenticatedDismissedBulletinIds}
    />
  );
};

export default Bulletins;
