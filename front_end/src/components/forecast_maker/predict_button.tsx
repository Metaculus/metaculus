"use client";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useMemo } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHourglass, faInfinity } from "@fortawesome/free-solid-svg-icons";
import cn from "@/utils/core/cn";

type Props = {
  predictLabel?: string;
  onSubmit: () => void;
  isDirty: boolean;
  hasUserForecast: boolean;
  isPending: boolean;
  isDisabled?: boolean;
  predictionExpirationChip?: ReactNode;
};

const PredictButton: FC<Props> = ({
  predictLabel,
  hasUserForecast,
  isPending,
  isDirty,
  onSubmit,
  isDisabled,
  predictionExpirationChip,
}) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const t = useTranslations();

  const disabled = useMemo(() => {
    if (!user) {
      return false;
    }

    if (isDisabled) {
      return true;
    }

    if (isPending) {
      return true;
    }

    if (hasUserForecast) {
      return false;
    }

    return !isDirty;
  }, [hasUserForecast, isDirty, isDisabled, isPending, user]);
  const buttonLabel = useMemo(() => {
    if (!user) {
      return t("signUpToPredict");
    }

    if (hasUserForecast && !isDirty) {
      return t("reaffirm");
    }

    return predictLabel ?? t("saveChange");
  }, [hasUserForecast, isDirty, predictLabel, t, user]);

  const handleClick = () => {
    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    }

    onSubmit();
  };

  const handleExpirationClick = () => {
    console.log("handleExpirationClick");
  };

  return (
    <div className="flex">
      <Button
        variant="primary"
        type="submit"
        disabled={disabled}
        onClick={handleClick}
        className={cn("", {
          "rounded-r-none": !!predictionExpirationChip,
        })}
      >
        {buttonLabel}
      </Button>

      {predictionExpirationChip && (
        <Button
          variant="secondary"
          onClick={handleExpirationClick}
          className="gap-1 rounded-l-none px-1.5"
        >
          <FontAwesomeIcon icon={faHourglass} />
          {predictionExpirationChip}
        </Button>
      )}
    </div>
  );
};

export default PredictButton;
