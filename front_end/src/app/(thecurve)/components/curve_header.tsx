"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import NavUserButton from "@/components/auth";
import { useAuth } from "@/contexts/auth_context";
import { useSurvey } from "@/contexts/survey_context";
import cn from "@/utils/core/cn";

type Props = {
  layout: "landing" | "survey";
  notPredictedQuestions: number;
};

const CurveHeader: FC<Props> = ({
  layout = "intro",
  notPredictedQuestions,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { questionIndex } = useSurvey();
  return (
    <header className="fixed left-0 top-0 z-50 flex h-12 w-full flex-auto flex-wrap items-center justify-between bg-blue-900 text-gray-0">
      <div className="flex h-full items-center">
        <Link
          href="/"
          className={cn(
            "inline-flex h-full max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center no-underline lg:bg-blue-800 lg:dark:bg-gray-0-dark",
            {
              "bg-blue-800 lg:dark:bg-gray-0-dark": layout === "survey",
            }
          )}
        >
          <h1 className="mx-3 my-0 font-league-gothic text-[28px] font-light tracking-widest !text-gray-0 antialiased">
            <span className="inline">M</span>
          </h1>
        </Link>
        <p
          className={cn("m-0 ml-3 text-lg font-bold lg:inline-block", {
            hidden: layout === "landing",
          })}
        >
          TheCurve
        </p>
      </div>
      {layout === "survey" ? (
        <p className="m-0 mr-5 text-sm text-gray-0/50">
          {t("questionsLeft", {
            count: notPredictedQuestions - (questionIndex ?? 0),
          })}
        </p>
      ) : (
        user && (
          <div className="z-10 flex h-full items-center justify-center">
            <NavUserButton btnClassName="text-[13px] h-full pr-6" />
          </div>
        )
      )}
    </header>
  );
};

export default CurveHeader;
