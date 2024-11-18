"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { useSurvey } from "@/contexts/survey_context";

type Props = {
  questionNumber: number;
  forecastedNumber?: number;
};

const CurveButton: FC<Props> = ({ questionNumber, forecastedNumber }) => {
  const router = useRouter();
  const { setQuestionIndex } = useSurvey();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const t = useTranslations();

  if (!user) {
    return (
      <div className="mt-10 flex flex-col items-center">
        <Button
          className="!border-gray-700 !px-5 !text-lg !text-gray-700 dark:!border-gray-700-dark dark:!text-gray-700-dark"
          onClick={() =>
            setCurrentModal({
              type: "signin",
            })
          }
        >
          {t("authOnMetaculus")}
        </Button>
        <p className="m-0 mt-4 text-sm text-gray-800 dark:text-gray-800-dark">
          {t("willForecastingOn", { questionNumber })}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col items-center">
      {forecastedNumber ? (
        <p className="m-0 text-sm text-gray-800 dark:text-gray-800-dark">
          {t.rich("forecastedOn", {
            forecastedNumber,
            questionNumber,
            bold: (chunks) => <b>{chunks}</b>,
          })}
        </p>
      ) : (
        <p className="m-0 text-sm text-gray-800 dark:text-gray-800-dark">
          {t.rich("questionsToForecast", {
            questionNumber,
            bold: (chunks) => <b>{chunks}</b>,
          })}
        </p>
      )}
      <Button
        className="mt-4 !border-gray-700 !px-5 !text-lg !text-gray-700 dark:!border-gray-700-dark dark:!text-gray-700-dark"
        onClick={() => {
          setQuestionIndex(0);
          router.push("/thecurve/survey");
        }}
      >
        {!!forecastedNumber ? t("continueForecasting") : t("startForecasting")}
      </Button>
    </div>
  );
};

export default CurveButton;
