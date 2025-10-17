"use client";

import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";

import AIBBenchmarkModel from "./aib-benchmark-model";
import { useAIBLeaderboard } from "../../../leaderboard/aib-leaderboard-provider";
import { getBotMeta } from "../../../leaderboard/bot_meta";

const MAX_VISIBLE_MODELS = 7;

const AIBBenchmarkModels: React.FC = () => {
  const t = useTranslations();
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

  const getDisplayName = (entry: (typeof entries)[number]) => {
    if (entry.user) return entry.user.username;
    if (entry.aggregation_method === "recency_weighted")
      return t("communityPrediction");
    return entry.aggregation_method ?? "Aggregate";
  };

  return (
    <div className="mt-[20px] space-y-2 md:mt-[43px]">
      <p className="m-0 flex justify-between font-normal text-gray-700 antialiased dark:text-gray-700-dark">
        <span>{t("aibModelsHeaderName")}</span>
        <span>{t("aibModelsHeaderScore")}</span>
      </p>

      {visible.map((entry) => {
        const meta = getBotMeta(entry.user?.username ?? "");
        const name = meta ? meta.label : getDisplayName(entry);
        const widthPct = scalePct(entry.score);

        const forecasts = entry.contribution_count ?? 0;

        return (
          <AIBBenchmarkModel
            key={String(entry.user?.id ?? name)}
            widthPct={widthPct}
            model={{
              id: String(entry.user?.id ?? name),
              name,
              forecasts,
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
          aria-label={t("aibShowAllAria", { count: entries.length })}
        >
          {t("aibShowAll", { count: entries.length })}
        </button>
      )}
    </div>
  );
};

export default AIBBenchmarkModels;
