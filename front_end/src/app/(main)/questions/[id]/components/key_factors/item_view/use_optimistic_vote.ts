import { useMemo, useState } from "react";

type OptimisticVoteResult<V extends number | null> = {
  vote: V | null;
  upCount: number;
  downCount: number;
  setOptimistic: (value: V | null) => void;
  clearOptimistic: () => void;
};

/**
 * Manages optimistic UI updates for up/down vote interactions.
 * While an API call is in flight, the vote selection and counts
 * reflect the expected outcome rather than server state.
 */
export function useOptimisticVote<V extends number | null>({
  serverVote,
  serverUpCount,
  serverDownCount,
  upValue,
  downValue,
}: {
  serverVote: V | null;
  serverUpCount: number;
  serverDownCount: number;
  upValue: V;
  downValue: V;
}): OptimisticVoteResult<V> {
  const [optimistic, setOptimisticRaw] = useState<V | null | undefined>(
    undefined
  );

  const vote = optimistic !== undefined ? optimistic : serverVote;

  const { upCount, downCount } = useMemo(() => {
    let up = serverUpCount;
    let down = serverDownCount;

    if (optimistic !== undefined) {
      const wasUp = serverVote === upValue;
      const wasDown = serverVote === downValue;
      const isUp = optimistic === upValue;
      const isDown = optimistic === downValue;

      if (wasUp && !isUp) up = Math.max(0, up - 1);
      if (!wasUp && isUp) up += 1;
      if (wasDown && !isDown) down = Math.max(0, down - 1);
      if (!wasDown && isDown) down += 1;
    }

    return { upCount: up, downCount: down };
  }, [
    serverUpCount,
    serverDownCount,
    serverVote,
    upValue,
    downValue,
    optimistic,
  ]);

  const setOptimistic = (value: V | null) => setOptimisticRaw(value);
  const clearOptimistic = () => setOptimisticRaw(undefined);

  return { vote, upCount, downCount, setOptimistic, clearOptimistic };
}
