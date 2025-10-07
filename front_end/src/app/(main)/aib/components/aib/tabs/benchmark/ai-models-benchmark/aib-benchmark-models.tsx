"use client";

import React, { useMemo, useState } from "react";

import AIBBenchmarkModel from "./aib-benchmark-model";
import { BenchmarkModel, DEFAULT_MODELS } from "./config";

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
    const minPct = 0.9;
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
      <div className="mt-[20px] space-y-2 md:mt-[43px]">
        <p className="m-0 flex justify-between font-normal text-gray-700 antialiased dark:text-gray-700-dark">
          <span>Model Name</span>
          <span>Score</span>
        </p>
        {finalModels.map((m) => {
          const widthPct = stats.scale(m.score);
          return <AIBBenchmarkModel key={m.id} widthPct={widthPct} model={m} />;
        })}

        {!isAllShown && (
          <button
            onClick={() => setIsAllShown((prev) => !prev)}
            className="w-full rounded-[4px] bg-blue-700 bg-opacity-10 p-[10px] text-left text-[14px] font-[500] text-blue-700 antialiased dark:bg-blue-700-dark dark:bg-opacity-10 dark:text-blue-700-dark sm:text-[16px]"
          >
            Show all ({count})
          </button>
        )}
      </div>
    </>
  );
};

export default AIBBenchmarkModels;
