import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { dismissFeedTile } from "@/app/(main)/actions";
import {
  POSTS_FEED_GC_TIME,
  POSTS_FEED_STALE_TIME,
  postsFeedKeys,
} from "@/components/posts_feed/hooks/use_posts_feed_query";
import { useAuth } from "@/contexts/auth_context";
import ClientMiscApi from "@/services/api/misc/misc.client";
import { PostWithForecasts } from "@/types/post";
import { CombinedFeedTile } from "@/types/projects";
import { logError } from "@/utils/core/errors";
import { seededRandom } from "@/utils/posts_feed";

// Extracted so Date.now() is not called directly in the hook body
function getDaySeed(): number {
  return Math.floor(Date.now() / 86_400_000);
}

export function useSidebarTile(post: PostWithForecasts) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: tiles = [], isLoading } = useQuery({
    // Shares cache with the feed so no extra network request when both are visible
    queryKey: postsFeedKeys.tiles(),
    queryFn: () => ClientMiscApi.getCombinedFeedTiles(),
    staleTime: POSTS_FEED_STALE_TIME,
    gcTime: POSTS_FEED_GC_TIME,
  });

  const tile = useMemo((): CombinedFeedTile | null => {
    if (dismissed) return null;
    // Seed on post.id + day: stable per page, rotates daily
    const rand = seededRandom(post.id + getDaySeed());

    for (const t of tiles) {
      // Filter ad tiles by exposure_rate; project tiles always show
      if (t.type === "ad" && rand() * 100 >= t.ad.exposure_rate) continue;
      return t;
    }
    return null;
  }, [tiles, dismissed, post.id]);

  const queryClient = useQueryClient();
  const onDismiss = useCallback(
    (id: string) => {
      setDismissed(true);
      void dismissFeedTile(id)
        .then(() => {
          queryClient.setQueryData<CombinedFeedTile[]>(
            postsFeedKeys.tiles(),
            (old) => old?.filter((t) => t.id !== id) ?? []
          );
        })
        .catch(logError);
    },
    [queryClient]
  );

  return { tile, onDismiss: user ? onDismiss : undefined, isLoading };
}
