"use client";
import { isNil } from "lodash";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { useSurvey } from "@/contexts/survey_context";

import CurveButton from "./curve_button";

type Props = {
  tournamentSlug: string;
  questionNumber: number;
  forecastedNumber?: number;
};

const CurveIntro: FC<Props> = ({
  tournamentSlug,
  questionNumber,
  forecastedNumber,
}) => {
  const t = useTranslations();
  const { questionIndex } = useSurvey();
  const notForecastedNumber = questionNumber - (forecastedNumber ?? 0);
  return (
    <div className="my-auto flex flex-col items-center justify-center">
      <div className="flex w-full items-center justify-center">
        <h1 className="m-0 flex h-[58px] w-[58px] items-center justify-center bg-blue-900 font-league-gothic font-light tracking-widest !text-gray-0 antialiased dark:bg-gray-0-dark">
          <span className="text-[40px]">M</span>
        </h1>
        <Image
          className="mx-[18px] dark:brightness-[0.8] dark:invert-[1]"
          src={"/images/x_mark.svg"}
          alt=""
          width={23}
          height={23}
        />
        <p className="m-0 text-4xl font-bold text-blue-900 dark:text-blue-900-dark">
          TheCurve
        </p>
      </div>

      {questionNumber === forecastedNumber ||
      (!isNil(questionIndex) && notForecastedNumber <= questionIndex + 1) ? (
        <>
          <h2 className="m-0 mt-9 max-w-[330px] text-center text-3xl font-medium lg:max-w-[500px]">
            {t("forecastedAllQuestions", { questionNumber })}
          </h2>
          <p className="dark:gray-800-dark m-0 mt-7 max-w-[330px] text-center text-xl text-gray-800 dark:text-gray-800-dark md:max-w-[500px]">
            {t("joinAgiWorkshop")}
          </p>
          <p className="dark:gray-800-dark m-0 mt-7 max-w-[330px] text-center text-base text-gray-800 dark:text-gray-800-dark md:max-w-[500px]">
            {t("visitTournamentPage")}
          </p>
          <Button
            className="mt-3 !border-gray-700 !px-5 !text-lg !text-gray-700 dark:!border-gray-700-dark dark:!text-gray-700-dark"
            href={`/tournament/${tournamentSlug}`}
          >
            {t("viewTournamentPage")}
          </Button>
        </>
      ) : (
        <>
          <h2 className="m-0 mt-9 text-3xl font-medium">{t("curveSurvey")}</h2>
          <p className="dark:gray-800-dark m-0 mt-7 max-w-[300px] text-center text-xl text-gray-800 dark:text-gray-800-dark md:max-w-[500px]">
            {t("curveIntroduction")}
          </p>

          <CurveButton
            questionNumber={questionNumber}
            forecastedNumber={forecastedNumber}
          />
        </>
      )}
    </div>
  );
};

export default CurveIntro;
