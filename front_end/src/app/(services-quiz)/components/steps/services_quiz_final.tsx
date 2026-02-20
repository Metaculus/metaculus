"use client";

import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";
import { useServicesQuizExitGuard } from "../quiz_state/services_quiz_exit_guard_provider";

const AUTO_REDIRECT_SECONDS = 5;

const ServicesQuizFinal: React.FC = () => {
  const t = useTranslations();
  const { exitNow } = useServicesQuizExitGuard();
  const { state } = useServicesQuizAnswers();

  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
  const didExitRef = useRef(false);

  const summaryText = useMemo(() => {
    const parts: string[] = [];

    if (state.selectedChallenges.length > 0) {
      const cleaned = state.selectedChallenges.map((ch) =>
        ch.replace(/\.+$/, "")
      );
      const challengeList =
        cleaned.length <= 2
          ? cleaned.join(` ${t("and")} `)
          : `${cleaned.slice(0, 2).join(", ")} ${t("and")} ${t("more").toLowerCase()}`;
      parts.push(t("summaryServiceDescription", { challenges: challengeList }));
    }

    if (state.timing) {
      const timingLabel =
        state.timing === "soon"
          ? t("withinThreeMonths")
          : state.timing === "later"
            ? t("afterThreeMonths")
            : state.timing === "flexible"
              ? t("onAFlexibleTimeline")
              : null;
      if (timingLabel) {
        parts.push(t("summaryTimingDescription", { timing: timingLabel }));
      }
    }

    if (state.whoForecasts) {
      if (state.whoForecasts.mode === "not_sure") {
        const lastPart = parts[parts.length - 1];
        if (lastPart && !/[.!?]$/.test(lastPart)) {
          parts[parts.length - 1] = lastPart + ".";
        }
        parts.push(t("summaryForecastersNotSure"));
      } else if (state.whoForecasts.selections.length > 0) {
        const forecasterList = state.whoForecasts.selections
          .map((s) =>
            s === "pros"
              ? t("metaculusPros")
              : s === "public"
                ? t("publicForecasters")
                : s === "experts"
                  ? t("yourInternalExperts")
                  : s
          )
          .join(` ${t("and")} `);
        parts.push(
          t("summaryForecastersDescription", { forecasters: forecasterList })
        );
      }
    }

    return parts.length > 0 ? parts.join(" ") : null;
  }, [state, t]);

  useEffect(() => {
    setSecondsLeft(AUTO_REDIRECT_SECONDS);
    didExitRef.current = false;

    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;

        if (next <= 0 && !didExitRef.current) {
          didExitRef.current = true;
          queueMicrotask(() => exitNow());
          return 0;
        }

        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [exitNow]);

  return (
    <div className="flex min-h-[calc(100vh-48px)] items-center justify-center px-6">
      <div
        className={cn(
          "flex w-full max-w-[480px] flex-col items-center text-center",
          "gap-4"
        )}
      >
        <FontAwesomeIcon
          icon={faCheckCircle}
          className="text-[58px] text-olive-500 dark:text-olive-500-dark"
        />

        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-[28px] font-bold leading-[34px] text-blue-800 dark:text-blue-800-dark">
            {t("weHaveReceivedYourRequest")}
          </h2>

          {summaryText && (
            <p className="m-0 text-base leading-6 text-gray-700 dark:text-gray-700-dark">
              {summaryText}
            </p>
          )}

          <p className="m-0 text-base leading-5 text-gray-800 dark:text-gray-800-dark">
            {t("ourTeamWillBeInContactSoon")}
          </p>
        </div>

        <Button
          variant="primary"
          className="mt-4 w-full rounded-full py-3 text-lg leading-5"
          onClick={() => {
            if (didExitRef.current) return;
            didExitRef.current = true;
            exitNow();
          }}
        >
          {t("backToServices")}
        </Button>

        <p className="m-0 text-xs text-gray-600 dark:text-gray-600-dark">
          {t("automaticRedirectInSeconds", { count: secondsLeft })}
        </p>
      </div>
    </div>
  );
};

export default ServicesQuizFinal;
