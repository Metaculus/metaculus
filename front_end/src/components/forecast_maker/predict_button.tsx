"use client";
import { faHourglassStart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useMemo } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import type { ForecastPayload } from "@/services/api/questions/questions.server";
import cn from "@/utils/core/cn";

type Props = {
  predictLabel?: string;
  onSubmit: () => void;
  isDirty: boolean;
  hasUserForecast: boolean;
  isUserForecastActive?: boolean;
  isPending: boolean;
  isDisabled?: boolean;
  predictionExpirationChip?: ReactNode;
  onPredictionExpirationClick?: () => void;
  // When provided, logged-out users get the email-capture drawer with their
  // forecast as the deferred action instead of the signup modal
  buildGatedForecastPayload?: () => ForecastPayload[] | null;
};

const PredictButton: FC<Props> = ({
  predictLabel,
  hasUserForecast,
  isUserForecastActive,
  isPending,
  isDirty,
  onSubmit,
  isDisabled,
  predictionExpirationChip,
  onPredictionExpirationClick,
  buildGatedForecastPayload,
}) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const t = useTranslations();

  const disabled = useMemo(() => {
    if (!user) {
      return false;
    }

    if (user.is_bot) {
      return true;
    }

    if (isDisabled) {
      return true;
    }

    if (isPending) {
      return true;
    }

    if (hasUserForecast) {
      // If isUserForecastActive is provided, use it to determine if forecast is active
      // If not provided, fall back to old behavior (assume active if hasUserForecast is true)
      if (isUserForecastActive !== undefined) {
        // Disable only if forecast is not active AND there are no dirty changes
        return !isUserForecastActive && !isDirty;
      }
      // Fallback: if isUserForecastActive is not provided, use old behavior
      return false;
    }

    return !isDirty;
  }, [
    hasUserForecast,
    isDirty,
    isDisabled,
    isPending,
    user,
    isUserForecastActive,
  ]);
  const buttonLabel = useMemo(() => {
    if (!user) {
      return buildGatedForecastPayload
        ? t("emailCaptureForecastTitle")
        : t("signUpToPredict");
    }

    if (hasUserForecast && !isDirty && isUserForecastActive) {
      return t("reaffirm");
    }

    return predictLabel ?? t("saveChange");
  }, [
    hasUserForecast,
    isDirty,
    predictLabel,
    t,
    user,
    isUserForecastActive,
    buildGatedForecastPayload,
  ]);

  const handleClick = () => {
    if (!user) {
      if (buildGatedForecastPayload) {
        const payload = buildGatedForecastPayload();
        setCurrentModal({
          type: "emailCapture",
          data: {
            trigger: "forecast",
            surface: "predictButton",
            // Untouched slider yields no payload; the drawer falls back to
            // sign-in-only copy and never clears a pending action
            gatedAction: payload?.length ? { type: "forecast", payload } : null,
          },
        });
      } else {
        setCurrentModal({ type: "signup" });
      }
      return;
    }

    onSubmit();
  };

  const showPredictionExpirationChip = !!predictionExpirationChip && !!user;

  return (
    <div className="flex">
      <Button
        variant="primary"
        type="submit"
        disabled={disabled}
        onClick={handleClick}
        className={cn("", {
          "rounded-r-none": showPredictionExpirationChip,
        })}
      >
        {buttonLabel}
      </Button>

      {showPredictionExpirationChip && (
        <Button
          variant="secondary"
          onClick={() => onPredictionExpirationClick?.()}
          disabled={disabled}
          className="gap-1 rounded-l-none px-1.5"
        >
          <FontAwesomeIcon icon={faHourglassStart} />
          {predictionExpirationChip}
        </Button>
      )}
    </div>
  );
};

export default PredictButton;
