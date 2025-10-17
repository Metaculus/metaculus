import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { ComponentType, SVGProps } from "react";

import openAiIcon from "@/app/(main)/aib/assets/ai-models/openai.svg";

type Props = {
  widthPct: number;
  model: {
    id: string;
    name: string;
    forecasts: number;
    score: number;
    iconLight?: StaticImageData | ComponentType<SVGProps<SVGSVGElement>>;
    iconDark?: StaticImageData | ComponentType<SVGProps<SVGSVGElement>>;
  };
};
const AIBBenchmarkModel: React.FC<Props> = ({ widthPct, model }) => {
  const t = useTranslations();
  const lightSrc = model.iconLight ?? openAiIcon;
  const darkSrc = model.iconDark ?? model.iconLight ?? openAiIcon;
  const score = Math.round(model.score * 100) / 100;
  const forecasts = Math.round(model.forecasts * 1000) / 1000;

  return (
    <Link
      className="flex cursor-default items-center justify-between rounded-[4px] border-[1px] border-transparent bg-gray-0 p-[10px] py-2 no-underline antialiased transition-colors duration-150 hover:border-blue-500 dark:bg-gray-0-dark dark:hover:border-blue-500-dark"
      style={{ width: `${widthPct}%` }}
      href="/aib/leaderboard"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-[10px] text-zinc-900 dark:text-zinc-100">
          <span className="relative inline-block h-4 w-4 sm:h-6 sm:w-6">
            <Image
              src={lightSrc}
              alt={model.name}
              fill
              className="block object-contain dark:hidden"
              sizes="24px"
            />
            <Image
              src={darkSrc}
              alt={model.name}
              fill
              className="hidden object-contain dark:block"
              sizes="24px"
            />
          </span>
          <p className="m-0 text-base font-[500] leading-[100%] text-gray-800 dark:text-gray-800-dark">
            {model.name}
          </p>
          <p className="font-base m-0 hidden text-sm text-gray-500 dark:text-gray-500-dark sm:block">
            {t("aibForecasts", { count: forecasts })}
          </p>
        </div>
      </div>
      <p className="m-0 text-[14px] font-semibold tracking-wider text-purple-700 dark:text-purple-700-dark sm:text-lg">
        {score}
      </p>
    </Link>
  );
};

export default AIBBenchmarkModel;
