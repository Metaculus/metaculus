import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { OnboardingStep } from "@/types/onboarding";
import { sendAnalyticsEvent } from "@/utils/analytics";

import Step0 from "./step_0";
import Step1 from "./step_1";
import Step2 from "./step_2";
import Step3 from "./step_3";
import Step4 from "./step_4";
import Step5 from "./step_5";

const STEPS = [Step0, Step1, Step2, Step3, Step4, Step5];

const StepsRouter: React.FC<OnboardingStep> = (props) => {
  const t = useTranslations();
  const {
    onboardingState: { currentStep },
    onPrev,
    handlePostpone,
    handleComplete,
  } = props;

  const CurrentStep = useMemo(() => {
    return STEPS[currentStep];
  }, [currentStep]);

  return (
    <>
      {currentStep > 0 && currentStep < STEPS.length - 1 && (
        <button
          onClick={onPrev}
          className="absolute left-2 top-1 px-3 py-2 text-xl text-blue-800 no-underline opacity-25 hover:text-blue-900 hover:opacity-40 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark md:top-2.5"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      )}
      {!isNil(CurrentStep) && <CurrentStep {...props} />}
      {currentStep < STEPS.length - 1 && (
        <>
          <div className="mt-4 flex w-full justify-center gap-3">
            <button
              onClick={() => {
                sendAnalyticsEvent("onboardingSkipped", {
                  event_category: "onboarding",
                });
                handleComplete();
              }}
              className="text-base text-blue-700 underline decoration-blue-700/70 underline-offset-4 hover:text-blue-800 hover:decoration-blue-700/90 dark:text-blue-700-dark dark:decoration-blue-700/70 dark:hover:text-blue-800-dark dark:hover:decoration-blue-700-dark/90 "
            >
              {t("skipTutorial")}
            </button>
            <button
              onClick={handlePostpone}
              className="text-base text-blue-700 underline decoration-blue-700/70 underline-offset-4 hover:text-blue-800 hover:decoration-blue-700/90 dark:text-blue-700-dark dark:decoration-blue-700/70 dark:hover:text-blue-800-dark dark:hover:decoration-blue-700-dark/90 "
            >
              {t("remindMeLater")}
            </button>
          </div>
          <p className="text-center opacity-60">
            {t("onboardingRemindMeLaterDescription")}
          </p>
        </>
      )}
    </>
  );
};

export default StepsRouter;
