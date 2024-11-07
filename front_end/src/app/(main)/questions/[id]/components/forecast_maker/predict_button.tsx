"use client";
import { useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

type Props = {
  predictLabel?: string;
  onSubmit: () => void;
  isDirty: boolean;
  hasUserForecast: boolean;
  isPending: boolean;
  isDisabled?: boolean;
};

const PredictButton: FC<Props> = ({
  predictLabel,
  hasUserForecast,
  isPending,
  isDirty,
  onSubmit,
  isDisabled,
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

  return (
    <Button
      variant="primary"
      type="submit"
      disabled={disabled}
      onClick={handleClick}
    >
      {buttonLabel}
    </Button>
  );
};

export default PredictButton;
