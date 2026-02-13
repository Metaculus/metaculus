"use client";

import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { useServicesQuizExitGuard } from "../quiz_state/services_quiz_exit_guard_provider";

const AUTO_REDIRECT_SECONDS = 5;

const ServicesQuizFinal: React.FC = () => {
  const t = useTranslations();
  const { exitNow } = useServicesQuizExitGuard();

  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
  const didExitRef = useRef(false);

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
          "flex w-full max-w-[420px] flex-col items-center text-center",
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
