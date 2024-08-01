"use client";

import {
  faChevronLeft,
  faChevronRight,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import React, { useState, forwardRef, FC } from "react";

import ForecastTextInput from "@/app/(main)/questions/[id]/components/forecast_maker/forecast_text_input";
import { toggleCMMComment } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";

import BaseModal from "../base_modal";

export const BINARY_MIN_VALUE = 0.001;
export const BINARY_MAX_VALUE = 0.999;
const clampPrediction = (value: number) =>
  Math.min(Math.max(BINARY_MIN_VALUE * 100, value), BINARY_MAX_VALUE * 100);

const cleanDigitPrediction = (value: number) => Math.floor(10 * value) / 10;

const CmmMakeForecast: FC<{
  updateForecast: (value: number) => Promise<void>;
  initialForecast?: number;
}> = ({ updateForecast, initialForecast }) => {
  initialForecast = cleanDigitPrediction(initialForecast ?? 50);

  const predictionToInputVal = (val: number) => val.toString() + "%";

  const [value, setValue] = useState(predictionToInputVal(initialForecast));
  const [forecast, setForecast] = useState(initialForecast);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  const onForecastChange = (value: number) => {
    setForecast(value);
  };

  const handleInputValueChange = (value: string) => {
    setValue(value);
  };

  let steps = [5, 15];

  if (forecast < 15 || forecast > 85) {
    steps = [1, 5];
  }

  if (forecast < 5 || forecast > 95) {
    steps = [0.1, 1];
  }

  const stepSmall = steps[0];
  const stepBig = steps[1];

  const onClickPredictButton = () => {
    setIsLoading(true);

    updateForecast(forecast / 100).finally(() => {
      setIsLoading(false);
    });
  };

  const onUpdateVal = (step: number) => {
    let newPred = clampPrediction(forecast + step);
    newPred = Math.floor(10 * newPred) / 10;
    setValue(predictionToInputVal(newPred));
    setForecast(newPred);
  };

  return (
    <div className="flex flex-col gap-8 sm:flex-row">
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          className="py-1"
          onClick={() => {
            onUpdateVal(-stepBig);
          }}
        >
          <FontAwesomeIcon icon={faChevronLeft} size="sm" />
          {stepBig}
        </Button>

        <Button
          size="xs"
          className="py-1"
          onClick={() => {
            onUpdateVal(-stepSmall);
          }}
        >
          <FontAwesomeIcon icon={faChevronLeft} size="sm" />
          {stepSmall}
        </Button>

        <ForecastTextInput
          value={value}
          minValue={BINARY_MIN_VALUE}
          maxValue={BINARY_MAX_VALUE}
          onChange={handleInputValueChange}
          onForecastChange={onForecastChange}
          isDirty={true}
        />
        <Button
          size="xs"
          className="py-1"
          onClick={() => {
            onUpdateVal(stepSmall);
          }}
        >
          <FontAwesomeIcon icon={faChevronRight} size="sm" />
          {stepSmall}
        </Button>

        <Button
          size="xs"
          className="py-1"
          onClick={() => {
            onUpdateVal(stepBig);
          }}
        >
          <FontAwesomeIcon icon={faChevronRight} size="sm" />
          {stepBig}
        </Button>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={onClickPredictButton}
        disabled={isLoading}
      >
        {t("cmmUpdateButton")}
      </Button>
    </div>
  );
};

interface CmmOverlayProps {
  showForecastingUI: boolean;
  forecast?: number;
  updateForecast?: (value: number) => Promise<void>;
  onClickScrollLink: () => void;
  isOpen: boolean;
  onClose: () => void;
}
const CmmOverlay: FC<CmmOverlayProps> = ({
  forecast,
  updateForecast,
  onClickScrollLink,
  isOpen,
  onClose,
  showForecastingUI,
}) => {
  const t = useTranslations();
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <h3 className="my-2 mb-4 w-full text-center">Update your prediction</h3>
      <div className="flex flex-col gap-2">
        {forecast && showForecastingUI && updateForecast && (
          <CmmMakeForecast
            updateForecast={updateForecast}
            initialForecast={forecast}
          />
        )}
        <Button variant="link" onClick={onClickScrollLink}>
          {t("cmmUpdatePredictionLink")}
        </Button>
      </div>
    </BaseModal>
  );
};

interface CmmToggleButtonProps {
  comment_id: number;
  disabled?: boolean;
  onCMMToggled: (enabled: boolean) => void;
  cmmEnabled: boolean;
  count: number;
}

const CmmToggleButton = forwardRef<HTMLButtonElement, CmmToggleButtonProps>(
  (
    {
      comment_id,
      disabled,
      cmmEnabled,
      onCMMToggled,
      count,
    }: CmmToggleButtonProps,
    ref
  ) => {
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const onChangedMyMind = async () => {
      try {
        setIsLoading(true);
        await toggleCMMComment({
          id: comment_id,
          enabled: !cmmEnabled,
        });
        onCMMToggled(!cmmEnabled);
      } catch (error) {
        console.error(error);

        // TODO: handle the error here
        onCMMToggled(cmmEnabled);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Button
        variant="text"
        size="md"
        onClick={onChangedMyMind}
        aria-label="Changed my mind"
        className="hover:bg-metac-gray-100 dark:hover:bg-metac-gray-100-dark whitespace-nowrap"
        disabled={isLoading || disabled}
        ref={ref}
      >
        <FontAwesomeIcon
          icon={faCaretUp}
          className={clsx(
            "size-4 rounded-full",
            {
              "bg-gradient-to-b p-1 text-blue-700 group-hover:from-blue-400 group-hover:to-blue-100 dark:text-blue-700-dark dark:group-hover:from-blue-400-dark dark:group-hover:to-blue-100-dark":
                !cmmEnabled,
            },
            {
              "bg-gradient-to-b from-olive-400 to-blue-100 p-1 text-olive-700 group-hover:from-olive-500 group-hover:to-blue-100 dark:from-olive-300-dark dark:to-blue-100-dark dark:text-olive-700-dark dark:group-hover:from-olive-500-dark dark:group-hover:to-blue-100-dark":
                cmmEnabled,
            }
          )}
        />

        <span className="text-metac-gray-900 dark:text-metac-gray-900-dark">
          {t("cmmButton")} ({count})
        </span>
      </Button>
    );
  }
);

CmmToggleButton.displayName = "CmmToggleButton";

export { CmmToggleButton, CmmOverlay };
