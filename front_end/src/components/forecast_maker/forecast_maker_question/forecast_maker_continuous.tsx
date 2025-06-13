"use client";
import { isNil } from "lodash";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useEffect, useMemo, useState } from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { sendPredictEvent } from "@/utils/analytics";
import {
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts/dataset";
import {
  clearQuantileComponents,
  isAllQuantileComponentsDirty,
  isOpenQuestionPredicted,
} from "@/utils/forecasts/helpers";
import {
  extractPrevNumericForecastValue,
  getInitialQuantileDistributionComponents,
  getInitialSliderDistributionComponents,
} from "@/utils/forecasts/initial_values";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { computeQuartilesFromCDF } from "@/utils/math";

import PredictionSuccessBox from "./prediction_success_box";
import ContinuousInput from "../continuous_input";
import {
  ForecastExpirationModal,
  forecastExpirationToDate,
  ForecastExpirationValue,
  useExpirationModalState,
} from "../forecast_expiration_modal";
import {
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";
import PredictButton from "../predict_button";
import QuestionResolutionButton from "../resolution";
import QuestionUnresolveButton from "../resolution/unresolve_button";
import cn from "@/utils/core/cn";

type Props = {
  post: PostWithForecasts;
  question: QuestionWithNumericForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage?: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerContinuous: FC<Props> = ({
  post,
  question,
  permission,
  canPredict,
  canResolve,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const [isDirty, setIsDirty] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const previousForecast = question.my_forecasts?.latest;
  const activeForecast = isOpenQuestionPredicted(question)
    ? previousForecast
    : undefined;
  const activeForecastValues = activeForecast
    ? extractPrevNumericForecastValue(activeForecast.distribution_input)
    : undefined;
  const hasUserForecast = !!activeForecastValues;
  const t = useTranslations();
  const [forecastInputMode, setForecastInputMode] =
    useState<ContinuousForecastInputType>(
      previousForecast?.distribution_input?.type ===
        ContinuousForecastInputType.Quantile
        ? ContinuousForecastInputType.Quantile
        : ContinuousForecastInputType.Slider
    );

  const [sliderDistributionComponents, setSliderDistributionComponents] =
    useState<DistributionSliderComponent[]>(
      getInitialSliderDistributionComponents(
        activeForecast,
        activeForecastValues,
        question
      )
    );
  const [quantileDistributionComponents, setQuantileDistributionComponents] =
    useState<DistributionQuantileComponent>(
      getInitialQuantileDistributionComponents(
        activeForecast,
        activeForecastValues,
        question
      )
    );

  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast?.forecast_values &&
        !previousForecast.distribution_input
    );

  // Update states of forecast maker after new forecast is made
  useEffect(() => {
    setForecastInputMode(
      activeForecast?.distribution_input?.type ===
        ContinuousForecastInputType.Quantile
        ? ContinuousForecastInputType.Quantile
        : ContinuousForecastInputType.Slider
    );
    setQuantileDistributionComponents(
      getInitialQuantileDistributionComponents(
        activeForecast,
        activeForecastValues,
        question
      )
    );
    setSliderDistributionComponents(
      getInitialSliderDistributionComponents(
        activeForecast,
        activeForecastValues,
        question
      )
    );
    setIsDirty(
      activeForecast
        ? activeForecast.distribution_input?.type !==
            ContinuousForecastInputType.Slider
        : false
    );
  }, [activeForecastValues, activeForecast, question]);

  const dataset = useMemo(() => {
    setSubmitError(undefined);
    if (forecastInputMode === ContinuousForecastInputType.Slider) {
      return getSliderNumericForecastDataset(
        sliderDistributionComponents,
        question
      );
    }

    const validationErrors = validateAllQuantileInputs({
      question,
      components: quantileDistributionComponents,
      t,
    });

    if (validationErrors.length > 0) {
      return {
        cdf: [],
        pmf: [],
      };
    }

    const quantileDataset = getQuantileNumericForecastDataset(
      quantileDistributionComponents,
      question
    );
    if (quantileDataset.error) {
      setSubmitError(
        new Error(t(quantileDataset.error) ?? t("unexpectedError"))
      );
    }
    return quantileDataset;
  }, [
    sliderDistributionComponents,
    quantileDistributionComponents,
    forecastInputMode,
    question,
    t,
  ]);
  const [showSuccessBox, setShowSuccessBox] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const userCdf: number[] = dataset.cdf;
  const userPreviousCdf: number[] | undefined =
    overlayPreviousForecast && previousForecast
      ? previousForecast.forecast_values
      : undefined;
  const latest = question.aggregations.recency_weighted.latest;
  const communityCdf: number[] | undefined =
    latest && !latest.end_time ? latest?.forecast_values : undefined;

  const handleAddComponent = () => {
    setSliderDistributionComponents([
      ...sliderDistributionComponents,
      {
        left: 0.4,
        right: 0.6,
        center: 0.5,
        weight: 1,
      },
    ]);
  };

  const userQuartiles = userCdf ? computeQuartilesFromCDF(userCdf) : undefined;

  const forecastDisplayValue = (value: number | null | undefined) =>
    getPredictionDisplayValue(value, {
      questionType: question.type,
      scaling: question.scaling,
      actual_resolve_time: question.actual_resolve_time ?? null,
    });

  const questionDuration =
    new Date(question.scheduled_close_time).getTime() -
    new Date(question.open_time ?? question.created_at).getTime();

  const {
    modalSavedState,
    setModalSavedState,
    expirationShortChip,
    isForecastExpirationModalOpen,
    setIsForecastExpirationModalOpen,
    previousForecastExpiration,
  } = useExpirationModalState(questionDuration, question.my_forecasts?.latest);

  const handlePredictSubmit = async (
    forecastExpiration: ForecastExpirationValue
  ) => {
    setSubmitError(undefined);
    sendPredictEvent(post, question, hideCP);

    if (forecastInputMode === ContinuousForecastInputType.Quantile) {
      const validationErrors = validateUserQuantileData({
        question,
        components: quantileDistributionComponents,
        cdf: userCdf,
        t,
      });

      if (validationErrors.length !== 0) {
        setSubmitError(
          !isNil(validationErrors[0])
            ? new Error(validationErrors[0])
            : new Error(t("unexpectedError"))
        );
        return;
      }
    }

    const response = await createForecasts(post.id, [
      {
        questionId: question.id,
        forecastData: {
          continuousCdf: userCdf,
          probabilityYes: null,
          probabilityYesPerCategory: null,
        },
        forecastEndTime: forecastExpirationToDate(forecastExpiration),
        distributionInput: {
          type: forecastInputMode,
          components:
            forecastInputMode === ContinuousForecastInputType.Slider
              ? sliderDistributionComponents
              : clearQuantileComponents(quantileDistributionComponents),
        } as DistributionSlider | DistributionQuantile,
      },
    ]);
    setIsDirty(false);
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    } else {
      setShowSuccessBox(true);
    }
    onPredictionSubmit?.();
  };
  const [submit, isPending] = useServerAction(handlePredictSubmit);

  const handlePredictWithdraw = async () => {
    setSubmitError(undefined);

    if (!previousForecast) return;

    const response = await withdrawForecasts(post.id, [
      {
        question: question.id,
      },
    ]);
    setIsDirty(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
    onPredictionSubmit?.();
  };
  const [withdraw, withdrawalIsPending] = useServerAction(
    handlePredictWithdraw
  );

  const handleDiscard = () => {
    setForecastInputMode(
      (prev) => activeForecast?.distribution_input?.type ?? prev
    );
    setSliderDistributionComponents(
      getInitialSliderDistributionComponents(
        activeForecast,
        activeForecastValues,
        question
      )
    );
    setQuantileDistributionComponents(
      getInitialQuantileDistributionComponents(
        activeForecast,
        activeForecastValues,
        question
      )
    );
    setIsDirty(false);
  };

  const SuccessBoxElement =
    showSuccessBox && !isPending ? (
      <PredictionSuccessBox
        post={post}
        forecastValue={`${forecastDisplayValue(userQuartiles?.median)} (${forecastDisplayValue(userQuartiles?.lower25)} - ${forecastDisplayValue(userQuartiles?.upper75)})`}
        onCommentClick={() => {
          router.push(`${pathname}?action=comment-with-forecast`);
        }}
        className="mb-4 w-full justify-center"
      />
    ) : null;

  let SubmitControls: ReactNode = null;
  if (canPredict) {
    SubmitControls = (
      <>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
            {!!user &&
              forecastInputMode === ContinuousForecastInputType.Slider && (
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={handleAddComponent}
                >
                  {t("addComponentButton")}
                </Button>
              )}

            {(forecastInputMode === ContinuousForecastInputType.Slider &&
              isDirty) ||
            (forecastInputMode === ContinuousForecastInputType.Quantile &&
              Object.values(quantileDistributionComponents ?? []).some(
                (value) => value?.isDirty === true
              )) ? (
              <Button variant="secondary" type="submit" onClick={handleDiscard}>
                {t("discard")}
              </Button>
            ) : (
              !!activeForecast && (
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={withdrawalIsPending}
                  onClick={withdraw}
                >
                  {t("withdraw")}
                </Button>
              )
            )}

            {forecastInputMode === ContinuousForecastInputType.Slider ? (
              <PredictButton
                onSubmit={() => submit(modalSavedState.forecastExpiration)}
                isDirty={isDirty}
                hasUserForecast={hasUserForecast}
                isPending={isPending}
                predictLabel={previousForecast ? undefined : t("predict")}
                predictionExpirationChip={expirationShortChip}
                onPredictionExpirationClick={() =>
                  setIsForecastExpirationModalOpen(true)
                }
              />
            ) : (
              <PredictButton
                onSubmit={() => submit(modalSavedState.forecastExpiration)}
                isDirty={quantileDistributionComponents.some((q) => q.isDirty)}
                hasUserForecast={hasUserForecast}
                isPending={isPending}
                predictLabel={previousForecast ? undefined : t("predict")}
                predictionExpirationChip={expirationShortChip}
                onPredictionExpirationClick={() =>
                  setIsForecastExpirationModalOpen(true)
                }
                isDisabled={
                  validateAllQuantileInputs({
                    question,
                    components: quantileDistributionComponents,
                    t,
                  }).length !== 0 || !isNil(submitError)
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
        </div>

        <FormError
          errors={submitError}
          className="mt-2 flex items-center justify-center"
          detached
        />
        <div className="h-[32px]">
          {(isPending || withdrawalIsPending) && <LoadingIndicator />}
        </div>

        {SuccessBoxElement}
      </>
    );
  }

  return (
    <>
      <ForecastExpirationModal
        savedState={modalSavedState}
        setSavedState={setModalSavedState}
        isOpen={isForecastExpirationModalOpen}
        onClose={() => {
          setIsForecastExpirationModalOpen(false);
        }}
        onReaffirm={hasUserForecast && !isDirty ? submit : undefined}
        questionDuration={questionDuration}
      />
      <ContinuousInput
        question={question}
        dataset={dataset}
        userCdf={userCdf}
        userPreviousCdf={userPreviousCdf}
        communityCdf={communityCdf}
        sliderComponents={sliderDistributionComponents}
        onSliderChange={(components) => {
          setSliderDistributionComponents(components);
          setIsDirty(true);
          setShowSuccessBox(false);
        }}
        quantileComponent={quantileDistributionComponents}
        onQuantileChange={(quantileComponents) => {
          setQuantileDistributionComponents(quantileComponents);
          isAllQuantileComponentsDirty(quantileComponents) && setIsDirty(true);
          setShowSuccessBox(false);
        }}
        overlayPreviousForecast={overlayPreviousForecast}
        onOverlayPreviousForecastChange={setOverlayPreviousForecast}
        forecastInputMode={forecastInputMode}
        onForecastInputModeChange={(mode) => {
          setForecastInputMode(mode);
          if (
            activeForecast &&
            activeForecast.distribution_input?.type !==
              ContinuousForecastInputType.Slider
          ) {
            setIsDirty(true);
          }
        }}
        hasUserForecast={hasUserForecast}
        isDirty={isDirty}
        submitControls={SubmitControls}
        disabled={!canPredict}
        predictionMessage={predictionMessage}
      />

      <div className="flex flex-col items-center justify-center">
        <QuestionUnresolveButton question={question} permission={permission} />
        {canResolve && (
          <QuestionResolutionButton
            question={question}
            permission={permission}
          />
        )}
      </div>
    </>
  );
};

export default ForecastMakerContinuous;
