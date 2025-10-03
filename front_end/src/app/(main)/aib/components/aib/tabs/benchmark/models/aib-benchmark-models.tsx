"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";

import anthropicIcon from "@/app/(main)/aib/assets/ai-models/claude.png";
import googleIcon from "@/app/(main)/aib/assets/ai-models/google.png";
import openAiIcon from "@/app/(main)/aib/assets/ai-models/gpt.png";
import xAiIcon from "@/app/(main)/aib/assets/ai-models/x.png";

type BenchmarkModel = {
  id: string;
  name: string;
  forecasts: number;
  score: number;
  iconKey: keyof typeof ICONS;
};

const ICONS = {
  openai: openAiIcon,
  google: googleIcon,
  anthropic: anthropicIcon,
  xai: xAiIcon,
} as const;

const DEFAULT_MODELS_BASE: BenchmarkModel[] = [
  {
    id: "gpt4",
    name: "GPT-4",
    forecasts: 1534,
    score: 58.5,
    iconKey: "openai",
  },
  {
    id: "gemini-1-0-pro-new",
    name: "Gemini 1.0 Pro",
    forecasts: 1534,
    score: 57.21,
    iconKey: "google",
  },
  {
    id: "claude-sonnet-37",
    name: "Claude 3.7 Sonnet",
    forecasts: 1534,
    score: 55.2,
    iconKey: "anthropic",
  },
  { id: "grok4", name: "Grok 4", forecasts: 1534, score: 52.8, iconKey: "xai" },
  {
    id: "gemini-2-5-flash",
    name: "Gemini 2.5 Flash",
    forecasts: 1534,
    score: 43.5,
    iconKey: "google",
  },
  {
    id: "gemini-1-0-pro",
    name: "Gemini 1.0 Pro",
    forecasts: 1534,
    score: 42.21,
    iconKey: "google",
  },
  {
    id: "claude-sonnet-37-dup",
    name: "Claude 3.7 Sonnet",
    forecasts: 1534,
    score: 41.2,
    iconKey: "anthropic",
  },
];

const DEFAULT_MODELS = [
  ...DEFAULT_MODELS_BASE,
  ...DEFAULT_MODELS_BASE.map((m) => ({ ...m, id: m.id + "-1" })),
  ...DEFAULT_MODELS_BASE.map((m) => ({ ...m, id: m.id + "-2" })),
];

const MAX_VISIBLE_MODELS = 7;

type Props = {
  models?: BenchmarkModel[];
};

const AIBBenchmarkModels: React.FC<Props> = ({ models = DEFAULT_MODELS }) => {
  const [isAllShown, setIsAllShown] = useState(false);
  const count = models.length;

  const stats = useMemo(() => {
    const scores = models.map((m) => m.score);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const span = Math.max(0.0001, max - min);
    const minPct = 0.6;
    const scale = (s: number) =>
      (minPct + ((s - min) / span) * (1 - minPct)) * 100;
    return { max, min, scale };
  }, [models]);

  const finalModels = useMemo(
    () => (isAllShown ? models : models.slice(0, MAX_VISIBLE_MODELS)),
    [isAllShown, models]
  );

  return (
    <>
      <div className="mt-[43px] space-y-2">
        <p className="m-0 flex justify-between font-normal text-gray-700 dark:text-gray-700-dark">
          <span>Model Name</span>
          <span>Score</span>
        </p>
        {finalModels.map((m) => {
          const widthPct = stats.scale(m.score);

          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-[4px] bg-gray-0 p-[10px] dark:bg-gray-0-dark"
              style={{ width: `${widthPct}%` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-[10px] text-zinc-900 dark:text-zinc-100">
                  <Image
                    src={ICONS[m.iconKey]}
                    className="h-6 w-6"
                    alt={m.name}
                  />
                  <p className="m-0 text-base font-[500] leading-[100%] text-gray-800 dark:text-gray-800-dark">
                    {m.name}
                  </p>
                  <p className="font-base m-0 text-sm text-gray-500 dark:text-gray-500-dark">{`${m.forecasts} forecasts`}</p>
                </div>
              </div>
              <p className="m-0 text-lg font-semibold text-purple-700 dark:text-purple-700-dark">
                {m.score}
              </p>
            </div>
          );
        })}

        {!isAllShown && (
          <button
            onClick={() => setIsAllShown((prev) => !prev)}
            className="w-full rounded-[4px] bg-blue-700 bg-opacity-10 p-[10px] text-left text-[16px] font-[500] text-blue-700 dark:bg-blue-700-dark dark:bg-opacity-10 dark:text-blue-700-dark"
          >
            Show all ({count})
          </button>
        )}
      </div>
    </>
  );
};

export default AIBBenchmarkModels;
