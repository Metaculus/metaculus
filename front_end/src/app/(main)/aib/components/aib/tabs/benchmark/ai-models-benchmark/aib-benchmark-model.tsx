"use client";

import Image, { StaticImageData } from "next/image";
import React from "react";

import openAiIcon from "@/app/(main)/aib/assets/ai-models/gpt.png";

type Props = {
  widthPct: number;
  model: {
    id: string;
    name: string;
    forecasts: number;
    score: number;
    icon: StaticImageData | undefined;
  };
};

const AIBBenchmarkModel: React.FC<Props> = ({ widthPct, model }) => {
  const score = Math.round(model.score * 100) / 100;
  const forecasts = Math.round(model.forecasts * 1000) / 1000;

  return (
    <div
      className="flex items-center justify-between rounded-[4px] bg-gray-0 p-[10px] py-2 antialiased dark:bg-gray-0-dark"
      style={{ width: `${widthPct}%` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-[10px] text-zinc-900 dark:text-zinc-100">
          <Image
            src={model.icon ?? openAiIcon}
            className="h-4 w-4 sm:h-6 sm:w-6"
            alt={model.name}
          />
          <p className="m-0 text-base font-[500] leading-[100%] text-gray-800 dark:text-gray-800-dark">
            {model.name}
          </p>
          <p className="font-base m-0 hidden text-sm text-gray-500 dark:text-gray-500-dark sm:block">
            {forecasts} forecasts
          </p>
        </div>
      </div>
      <p className="m-0 text-[14px] font-semibold tracking-wider text-purple-700 dark:text-purple-700-dark sm:text-lg">
        {score}
      </p>
    </div>
  );
};

export default AIBBenchmarkModel;
