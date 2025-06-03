import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import React, {
  FC,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions, QuestionStatus } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
} from "@/types/question";
import { TranslationKey } from "@/types/translations";
import cn from "@/utils/core/cn";
import {
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts/dataset";
import {
  getNormalizedContinuousForecast,
  isOpenQuestionPredicted,
} from "@/utils/forecasts/helpers";
import { formatResolution } from "@/utils/formatters/resolution";
import { canWithdrawForecast } from "@/utils/questions/predictions";

import { ContinuousGroupOption } from "../continuous_group_accordion/group_forecast_accordion";
import ContinuousInput from "../continuous_input";
import {
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";
import PredictButton from "../predict_button";
import ScoreDisplay from "../resolution/score_display";
import {
  ForecastExpirationModal,
  ForecastExpirationValue,
  useExpirationModalState,
} from "../forecast_expiration_modal";

type Props = {
  option: ContinuousGroupOption;
  canPredict: boolean;
  isPending: boolean;
  permission?: ProjectPermissions;
  handleChange: (
    optionId: number,
    distribution: DistributionSlider | DistributionQuantile,
    forecastExpiration?: ForecastExpirationValue
  ) => void;
  handleAddComponent: (option: ContinuousGroupOption) => void;
  handleResetForecasts: (option?: ContinuousGroupOption) => void;
  handlePredictSubmit: (
    id: number,
    forecastExpiration: ForecastExpirationValue
  ) => Promise<
    | {
        errors: ErrorResponse | undefined;
      }
    | undefined
  >;
  handlePredictWithdraw: (id: number) => Promise<
    | {
        errors: ErrorResponse | undefined;
      }
    | undefined
  >;
  setForecastInputMode: (mode: ContinuousForecastInputType) => void;
  copyMenu?: ReactNode;
  handleForecastExpiration: (
    optionId: number,
    forecastExpiration: ForecastExpirationValue
  ) => void;
};

const ContinuousInputWrapper: FC<PropsWithChildren<Props>> = ({
  option,
  canPredict,
  isPending,
  permission,
  handleChange,
  handleAddComponent,
  handleResetForecasts,
  handlePredictSubmit,
  handlePredictWithdraw,
  setForecastInputMode,
  handleForecastExpiration,
  copyMenu,
}) => {
  const { user } = useAuth();
  const t = useTranslations();
  const locale = useLocale();

  const previousForecast = option.question.my_forecasts?.latest;
  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast?.forecast_values &&
        !previousForecast.distribution_input
    );

  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const { forecastInputMode, isDirty, userQuantileForecast } = option;

  const forecast = useMemo(
    () =>
      forecastInputMode === ContinuousForecastInputType.Slider
        ? getNormalizedContinuousForecast(option.userSliderForecast)
        : option.userQuantileForecast,
    [option, forecastInputMode]
  );

  const hasUserForecast = useMemo(() => {
    const prevForecast = option.question.my_forecasts?.latest;

    return (
      !!prevForecast &&
      !!prevForecast.distribution_input &&
      isOpenQuestionPredicted(option.question)
    );
  }, [option]);

  const dataset = useMemo(() => {
    setSubmitError(undefined);
    if (forecastInputMode === ContinuousForecastInputType.Slider) {
      return getSliderNumericForecastDataset(
        forecast as DistributionSliderComponent[],
        option.question
      );
    }
    const validationErrors = validateAllQuantileInputs({
      question: option.question,
      components: forecast as DistributionQuantileComponent,
      t,
    });

    if (validationErrors.length > 0) {
      return {
        cdf: [],
        pmf: [],
      };
    }

    const quantileDataset = getQuantileNumericForecastDataset(
      forecast as DistributionQuantileComponent,
      option.question
    );
    if (quantileDataset.error) {
      setSubmitError(
        new Error(t(quantileDataset.error) ?? t("unexpectedError"))
      );
    }
    return quantileDataset;
  }, [option, forecast, forecastInputMode, t]);

  const predictionMessage = useMemo(
    () => getSubquestionPredictionInputMessage(option),
    [option]
  );

  const onSubmit = useCallback(
    async (forecastExpiration: ForecastExpirationValue) => {
      setSubmitError(undefined);
      if (option.forecastInputMode === ContinuousForecastInputType.Quantile) {
        const errors = validateUserQuantileData({
          question: option.question,
          components: option.userQuantileForecast,
          cdf: dataset.cdf,
          t,
        });
        if (errors.length) {
          setSubmitError(new Error(errors[0] ?? t("unexpectedError")));
          return;
        }
      }

      const response = await handlePredictSubmit(option.id, forecastExpiration);
      if (response && "errors" in response && !!response.errors) {
        setSubmitError(response.errors);
      }
    },
    [handlePredictSubmit, option, dataset, t]
  );

  const onWithdraw = useCallback(async () => {
    setSubmitError(undefined);
    const response = await handlePredictWithdraw(option.id);
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
  }, [handlePredictWithdraw, option]);

  const userCdf: number[] | undefined = getSliderNumericForecastDataset(
    getNormalizedContinuousForecast(option.userSliderForecast),
    option.question
  ).cdf;
  const userPreviousCdf: number[] | undefined =
    overlayPreviousForecast && previousForecast
      ? previousForecast.forecast_values
      : undefined;
  const communityCdf: number[] | undefined =
    option.question.aggregations.recency_weighted.latest?.forecast_values;

  const questionDuration =
    new Date(option.question.scheduled_close_time).getTime() -
    new Date(option.question.open_time ?? option.question.created_at).getTime();

  const {
    modalSavedState,
    setModalSavedState,
    expirationShortChip,
    isForecastExpirationModalOpen,
    setIsForecastExpirationModalOpen,
    previousForecastExpiration,
  } = useExpirationModalState(
    questionDuration,
    option.question.my_forecasts?.latest
  );

  useEffect(() => {
    handleForecastExpiration(option.id, modalSavedState.forecastExpiration);
  }, [handleForecastExpiration, option.id, modalSavedState.forecastExpiration]);

  let SubmitControls: ReactNode = null;
  if (option.question.status === QuestionStatus.OPEN && canPredict) {
    SubmitControls = (
      <>
        <FormError
          errors={submitError}
          className="mb-2 flex items-center justify-center"
          detached
        />
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-3 p-4",
            {
              "pt-0":
                forecastInputMode === ContinuousForecastInputType.Quantile,
            }
          )}
        >
          {!!user && (
            <>
              {forecastInputMode === ContinuousForecastInputType.Slider && (
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={() => handleAddComponent(option)}
                >
                  {t("addComponentButton")}
                </Button>
              )}
              <Button
                variant="secondary"
                type="reset"
                onClick={() => handleResetForecasts(option)}
                disabled={
                  forecastInputMode === ContinuousForecastInputType.Slider
                    ? !isDirty
                    : !userQuantileForecast.some((q) => q.isDirty)
                }
              >
                {t("discardChangesButton")}
              </Button>
              {canWithdrawForecast(option.question, permission) && (
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={isPending}
                  onClick={onWithdraw}
                >
                  {t("withdrawForecast")}
                </Button>
              )}
            </>
          )}

          {forecastInputMode === ContinuousForecastInputType.Slider ? (
            <PredictButton
              onSubmit={() => onSubmit(modalSavedState.forecastExpiration)}
              isDirty={option.isDirty}
              hasUserForecast={hasUserForecast}
              isPending={isPending}
              isDisabled={
                option.userSliderForecast === null &&
                option.question.status !== QuestionStatus.OPEN
              }
              predictLabel={previousForecast ? undefined : t("predict")}
              predictionExpirationChip={expirationShortChip}
              onPredictionExpirationClick={() =>
                setIsForecastExpirationModalOpen(true)
              }
            />
          ) : (
            <PredictButton
              onSubmit={() => onSubmit(modalSavedState.forecastExpiration)}
              isDirty={option.userQuantileForecast.some((q) => q.isDirty)}
              hasUserForecast={hasUserForecast}
              isPending={isPending}
              isDisabled={
                validateAllQuantileInputs({
                  question: option.question,
                  components: option.userQuantileForecast,
                  t,
                }).length !== 0 || !isNil(submitError)
              }
              predictLabel={previousForecast ? undefined : t("predict")}
              predictionExpirationChip={expirationShortChip}
              onPredictionExpirationClick={() =>
                setIsForecastExpirationModalOpen(true)
              }
            />
          )}
        </div>
        {previousForecastExpiration && (
          <span
            className={cn(
              "text-center text-xs text-gray-800 dark:text-gray-800-dark",
              previousForecastExpiration.expiresSoon &&
                "text-salmon-800 dark:text-salmon-800-dark"
            )}
          >
            {previousForecastExpiration.isExpired
              ? t("predictionExpiredText", {
                  time: previousForecastExpiration.string,
                })
              : t("predictionWillExpireInText", {
                  time: previousForecastExpiration.string,
                })}
          </span>
        )}
      </>
    );
  }

  return (
    <div className="mt-0.5 bg-blue-600/10 dark:bg-blue-400/10">
      <div className="p-4 pb-0">
        <ForecastExpirationModal
          savedState={modalSavedState}
          setSavedState={setModalSavedState}
          isOpen={isForecastExpirationModalOpen}
          onClose={() => setIsForecastExpirationModalOpen(false)}
          questionDuration={questionDuration}
          onReaffirm={hasUserForecast && !isDirty ? onSubmit : undefined}
        />

        <ContinuousInput
          question={option.question}
          dataset={dataset}
          userCdf={userCdf}
          userPreviousCdf={userPreviousCdf}
          communityCdf={communityCdf}
          sliderComponents={option.userSliderForecast}
          onSliderChange={(components) =>
            handleChange(option.id, {
              components: components,
              type: ContinuousForecastInputType.Slider,
            })
          }
          quantileComponent={option.userQuantileForecast}
          onQuantileChange={(quantileComponents) =>
            handleChange(option.id, {
              components: quantileComponents,
              type: ContinuousForecastInputType.Quantile,
            })
          }
          overlayPreviousForecast={overlayPreviousForecast}
          onOverlayPreviousForecastChange={setOverlayPreviousForecast}
          forecastInputMode={forecastInputMode}
          onForecastInputModeChange={setForecastInputMode}
          hasUserForecast={hasUserForecast}
          isDirty={option.isDirty}
          submitControls={SubmitControls}
          disabled={
            !canPredict || option.question.status !== QuestionStatus.OPEN
          }
          predictionMessage={
            predictionMessage ? t(predictionMessage) : undefined
          }
          menu={option.menu}
          copyMenu={copyMenu}
        />
      </div>

      {!!option.resolution && (
        <div className="mb-3 text-gray-600 dark:text-gray-600-dark">
          <p className="my-1 flex justify-center gap-1 text-base">
            {t("resolutionDescriptionContinuous")}
            <strong
              className="text-purple-800 dark:text-purple-800-dark"
              suppressHydrationWarning
            >
              {formatResolution({
                resolution: option.resolution,
                questionType: option.question.type,
                locale,
                scaling: option.question.scaling,
                actual_resolve_time:
                  option.question.actual_resolve_time ?? null,
              })}
            </strong>
          </p>
        </div>
      )}

      {!isNil(option.question.resolution) && (
        <div className="my-4 p-4">
          <ScoreDisplay question={option.question} variant="transparent" />
        </div>
      )}
    </div>
  );
};

function getSubquestionPredictionInputMessage(
  option: ContinuousGroupOption
): TranslationKey | null {
  switch (option.question.status) {
    case QuestionStatus.CLOSED:
      return "predictionClosedMessage";
    case QuestionStatus.UPCOMING:
      return "predictionUpcomingMessage";
    default:
      return null;
  }
}

export default ContinuousInputWrapper;
