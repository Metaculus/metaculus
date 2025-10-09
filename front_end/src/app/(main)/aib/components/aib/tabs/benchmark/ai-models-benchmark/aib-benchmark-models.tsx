"use client";

import React, { useMemo, useState } from "react";

import AIBBenchmarkModel from "./aib-benchmark-model";
import { useAIBLeaderboard } from "../../../leaderboard/aib-leaderboard-provider";
import { getBotMeta } from "../../../leaderboard/bot_meta";

const MAX_VISIBLE_MODELS = 7;

const AIBBenchmarkModels: React.FC = () => {
  const { leaderboard } = useAIBLeaderboard();

  const entries = useMemo(() => {
    const e = [...(leaderboard.entries ?? [])];
    e.sort((a, b) => {
      if (a.rank != null && b.rank != null) return a.rank - b.rank;
      return b.score - a.score;
    });
    return e;
  }, [leaderboard.entries]);

  const [isAllShown, setIsAllShown] = useState(false);
  const visible = isAllShown ? entries : entries.slice(0, MAX_VISIBLE_MODELS);

  const scalePct = useMemo(() => {
    if (entries.length === 0) return () => 0;
    const scores = entries.map((e) => e.score);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const span = Math.max(0.0001, max - min);
    const minPct = 0.9;
    return (s: number) => (minPct + ((s - min) / span) * (1 - minPct)) * 100;
  }, [entries]);

  return (
    <div className="mt-[20px] space-y-2 md:mt-[43px]">
      <p className="m-0 flex justify-between font-normal text-gray-700 antialiased dark:text-gray-700-dark">
        <span>Model Name</span>
        <span>Score</span>
      </p>

      {visible.map((entry) => {
        const username = entry.user?.username ?? "unknown";
        const meta = getBotMeta(username);
        const widthPct = scalePct(entry.score);

        return (
          <AIBBenchmarkModel
            key={username}
            widthPct={widthPct}
            model={{
              id: String(entry.user?.id ?? username),
              name: meta.label,
              forecasts: entry.coverage,
              score: entry.score,
              icon: meta.icon,
            }}
          />
        );
      })}

      {!isAllShown && entries.length > MAX_VISIBLE_MODELS && (
        <button
          onClick={() => setIsAllShown(true)}
          className="w-full rounded-[4px] bg-blue-700 bg-opacity-10 p-[10px] text-left text-[14px] font-[500] text-blue-700 antialiased dark:bg-blue-700-dark dark:bg-opacity-10 dark:text-blue-700-dark sm:text-[16px]"
        >
          Show all ({entries.length})
        </button>
      )}
    </div>
  );
};

export default AIBBenchmarkModels;
