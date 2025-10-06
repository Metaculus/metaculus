"use client";

import Image, { StaticImageData } from "next/image";
import React from "react";

import anthropicIcon from "@/app/(main)/aib/assets/ai-models/claude.png";
import googleIcon from "@/app/(main)/aib/assets/ai-models/google.png";
import openAiIcon from "@/app/(main)/aib/assets/ai-models/gpt.png";
import xAiIcon from "@/app/(main)/aib/assets/ai-models/x.png";

import { BenchmarkModel, IconKey } from "./config";

type Props = {
  widthPct: number;
  model: BenchmarkModel;
};

const AIBBenchmarkModel: React.FC<Props> = ({ widthPct, model }) => {
  return (
    <div
      className="flex items-center justify-between rounded-[4px] bg-gray-0 p-[10px] dark:bg-gray-0-dark"
      style={{ width: `${widthPct}%` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-[10px] text-zinc-900 dark:text-zinc-100">
          <Image
            src={ICONS[model.iconKey]}
            className="h-6 w-6"
            alt={model.name}
          />
          <p className="m-0 text-base font-[500] leading-[100%] text-gray-800 dark:text-gray-800-dark">
            {model.name}
          </p>
          <p className="font-base m-0 text-sm text-gray-500 dark:text-gray-500-dark">{`${model.forecasts} forecasts`}</p>
        </div>
      </div>
      <p className="m-0 text-lg font-semibold text-purple-700 dark:text-purple-700-dark">
        {model.score}
      </p>
    </div>
  );
};

const ICONS: Record<IconKey, StaticImageData> = {
  openai: openAiIcon,
  google: googleIcon,
  anthropic: anthropicIcon,
  xai: xAiIcon,
} as const;

export default AIBBenchmarkModel;
