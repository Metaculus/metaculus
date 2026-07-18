"use client";
import { useQuery } from "@tanstack/react-query";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/contexts/auth_context";
import ClientMiscApi from "@/services/api/misc/misc.client";
import type { BulletinItem } from "@/services/api/misc/misc.shared";
import { logError } from "@/utils/core/errors";

import { dismissBulletin } from "../actions";
import Bulletin from "./bulletin";
import {
  BULLETINS_QUERY_KEY,
  BULLETINS_STALE_TIME,
  DISMISSED_BULLETINS_COOKIE,
  serializeDismissedBulletinIds,
} from "./bulletins_shared";

type Props = {
  initialBulletins: BulletinItem[];
  initialDismissedBulletinIds: number[];
  initialSyncedDismissedBulletinIds: number[];
};

const writeDismissedBulletinIdsToCookie = (ids: Iterable<number>) => {
  const serializedIds = serializeDismissedBulletinIds(ids);

  document.cookie = `${DISMISSED_BULLETINS_COOKIE}=${serializedIds}; path=/; max-age=31536000; samesite=lax`;
};

const BulletinsClient: FC<Props> = ({
  initialBulletins,
  initialDismissedBulletinIds,
  initialSyncedDismissedBulletinIds,
}) => {
  const { user } = useAuth();
  const [dismissedBulletinIds, setDismissedBulletinIds] = useState(
    () => new Set(initialDismissedBulletinIds)
  );
  const syncedDismissedBulletinIdsRef = useRef(
    new Set(initialSyncedDismissedBulletinIds)
  );
  const pendingDismissedBulletinIdsRef = useRef(new Set<number>());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissedBulletinIds(() => new Set(initialDismissedBulletinIds));
    syncedDismissedBulletinIdsRef.current = new Set(
      initialSyncedDismissedBulletinIds
    );
    pendingDismissedBulletinIdsRef.current = new Set();
  }, [initialDismissedBulletinIds, initialSyncedDismissedBulletinIds]);

  const { data: bulletins = [] } = useQuery({
    queryKey: BULLETINS_QUERY_KEY,
    initialData: initialBulletins,
    staleTime: BULLETINS_STALE_TIME,
    queryFn: async () => {
      try {
        return await ClientMiscApi.getBulletins();
      } catch (error) {
        logError(error);
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    // Cookie dismissals are browser-local. For authenticated users, sync only
    // active bulletin ids that the DB did not already report as dismissed.
    const activeBulletinIds = new Set(bulletins.map((bulletin) => bulletin.id));

    dismissedBulletinIds.forEach((bulletinId) => {
      if (!activeBulletinIds.has(bulletinId)) {
        return;
      }

      if (syncedDismissedBulletinIdsRef.current.has(bulletinId)) {
        return;
      }

      if (pendingDismissedBulletinIdsRef.current.has(bulletinId)) {
        return;
      }

      pendingDismissedBulletinIdsRef.current.add(bulletinId);
      void dismissBulletin(bulletinId)
        .then(() => {
          syncedDismissedBulletinIdsRef.current.add(bulletinId);
        })
        .catch((error) => {
          logError(error);
        })
        .finally(() => {
          pendingDismissedBulletinIdsRef.current.delete(bulletinId);
        });
    });
  }, [bulletins, dismissedBulletinIds, user]);

  const visibleBulletin = useMemo(
    () => bulletins.find((bulletin) => !dismissedBulletinIds.has(bulletin.id)),
    [bulletins, dismissedBulletinIds]
  );

  if (!visibleBulletin) {
    return null;
  }

  return (
    <Bulletin
      key={visibleBulletin.id}
      text={visibleBulletin.text}
      onHidden={() => {
        setDismissedBulletinIds((currentDismissedBulletinIds) => {
          const nextDismissedBulletinIds = new Set(currentDismissedBulletinIds);
          nextDismissedBulletinIds.add(visibleBulletin.id);
          writeDismissedBulletinIdsToCookie(nextDismissedBulletinIds);
          return nextDismissedBulletinIds;
        });
      }}
    />
  );
};

export default BulletinsClient;
