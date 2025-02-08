"use client";
import { isNil } from "lodash";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
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
import { useServerAction } from "@/hooks/use_server_action";
import { ForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponentWithState,
  DistributionSlider,
  DistributionSliderComponent,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getCdfBounds, getDisplayValue } from "@/utils/charts";
import {
  clearQuantileComponents,
  extractPrevNumericForecastValue,
  getInitialQuantileDistributionComponents,
  getInitialSliderDistributionComponents,
  getNumericForecastDataset,
  getQuantileNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import { sendGAPredictEvent } from "./ga_events";
import PredictionSuccessBox from "./prediction_success_box";
import { useHideCP } from "../../cp_provider";
import ContinuousSlider from "../continuous_slider";
import { validateAllQuantileInputs } from "../helpers";
import NumericForecastTable from "../numeric_table";
import PredictButton from "../predict_button";
import QuestionResolutionButton from "../resolution";
import QuestionUnresolveButton from "../resolution/unresolve_button";

type Props = {
  post: PostWithForecasts;
  question: QuestionWithNumericForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage?: ReactNode;
};

const ForecastMakerContinuous: FC<Props> = ({
  post,
  question,
  permission,
  canPredict,
  canResolve,
  predictionMessage,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const [isDirty, setIsDirty] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const previousForecast = question.my_forecasts?.latest;
  const activeForecast =
    !!previousForecast && isNil(previousForecast.end_time)
      ? previousForecast
      : undefined;
  const activeForecastValues = activeForecast
    ? extractPrevNumericForecastValue(activeForecast.distribution_input)
    : undefined;
  const withCommunityQuartiles = !user || !hideCP;
  const hasUserForecast = !!activeForecastValues;
  const t = useTranslations();
  const [forecastInputMode, setForecastInputMode] = useState<ForecastInputType>(
    previousForecast?.distribution_input.type === ForecastInputType.Quantile
      ? ForecastInputType.Quantile
      : ForecastInputType.Slider
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
    useState<DistributionQuantileComponentWithState[]>(
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
      activeForecast?.distribution_input.type === ForecastInputType.Quantile
        ? ForecastInputType.Quantile
        : ForecastInputType.Slider
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
        ? activeForecast.distribution_input.type !== ForecastInputType.Slider
        : false
    );
  }, [activeForecastValues, activeForecast, question]);

  const dataset = useMemo(
    () =>
      forecastInputMode === ForecastInputType.Slider
        ? getNumericForecastDataset(
            sliderDistributionComponents,
            question.open_lower_bound,
            question.open_upper_bound
          )
        : validateAllQuantileInputs({
              question,
              components: quantileDistributionComponents,
              t,
              checkDirtyState: false,
            })
          ? getQuantileNumericForecastDataset(
              quantileDistributionComponents,
              question
            )
          : {
              cdf: [],
              pmf: [],
            },
    [
      sliderDistributionComponents,
      quantileDistributionComponents,
      forecastInputMode,
      question,
      t,
    ]
  );

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
    getDisplayValue({
      value,
      questionType: question.type,
      scaling: question.scaling,
    });

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);
    sendGAPredictEvent(post, question, hideCP);

    if (forecastInputMode === ForecastInputType.Quantile) {
      const validated = validateAllQuantileInputs({
        question,
        components: quantileDistributionComponents,
        t,
      });

      if (!validated) {
        setSubmitError(new Error(t("invalidQuantileInput")));
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
        distributionInput: {
          type: forecastInputMode,
          components:
            forecastInputMode === ForecastInputType.Slider
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
  };
  const [withdraw, withdrawalIsPending] = useServerAction(
    handlePredictWithdraw
  );

  const handleDiscard = () => {
    setForecastInputMode(
      activeForecast?.distribution_input.type === ForecastInputType.Quantile
        ? ForecastInputType.Quantile
        : ForecastInputType.Slider
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

  return (
    <>
      <ContinuousSlider
        components={sliderDistributionComponents}
        dataset={dataset}
        onChange={(components) => {
          setSliderDistributionComponents(components);
          setIsDirty(true);
          setShowSuccessBox(false);
        }}
        overlayPreviousForecast={overlayPreviousForecast}
        setOverlayPreviousForecast={setOverlayPreviousForecast}
        question={question}
        disabled={!canPredict}
        showInputModeSwitcher
        forecastInputMode={forecastInputMode}
        setForecastInputMode={setForecastInputMode}
      />

      {canPredict && forecastInputMode === ForecastInputType.Slider && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
            {!!user && (
              <Button
                variant="secondary"
                type="reset"
                onClick={handleAddComponent}
              >
                {t("addComponentButton")}
              </Button>
            )}

            {!!activeForecast && (
              <Button
                variant="secondary"
                type="submit"
                disabled={withdrawalIsPending}
                onClick={withdraw}
              >
                {t("withdraw")}
              </Button>
            )}
            <PredictButton
              onSubmit={submit}
              isDirty={isDirty}
              hasUserForecast={hasUserForecast}
              isPending={isPending}
              predictLabel={previousForecast ? undefined : t("predict")}
            />

            {isDirty && (
              <Button
                variant="secondary"
                type="submit"
                disabled={
                  !isDirty &&
                  !Object.values(quantileDistributionComponents[0] ?? {}).some(
                    (value) => value?.isDirty === true
                  )
                }
                onClick={handleDiscard}
              >
                {t("discard")}
              </Button>
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

          {showSuccessBox && !isPending && (
            <PredictionSuccessBox
              post={post}
              forecastValue={`${forecastDisplayValue(userQuartiles?.median)} (${forecastDisplayValue(userQuartiles?.lower25)} - ${forecastDisplayValue(userQuartiles?.upper75)})`}
              onCommentClick={() => {
                router.push(`${pathname}?action=comment-with-forecast`);
              }}
              className="mb-4 w-full justify-center"
            />
          )}
        </>
      )}
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
        </div>
      )}

      <NumericForecastTable
        question={question}
        userBounds={getCdfBounds(userCdf)}
        userQuartiles={userCdf ? computeQuartilesFromCDF(userCdf) : undefined}
        quantileComponents={quantileDistributionComponents}
        onQuantileChange={setQuantileDistributionComponents}
        userPreviousBounds={getCdfBounds(userPreviousCdf)}
        userPreviousQuartiles={
          userPreviousCdf ? computeQuartilesFromCDF(userPreviousCdf) : undefined
        }
        communityBounds={getCdfBounds(communityCdf)}
        communityQuartiles={
          communityCdf ? computeQuartilesFromCDF(communityCdf) : undefined
        }
        withCommunityQuartiles={withCommunityQuartiles}
        isDirty={isDirty}
        hasUserForecast={hasUserForecast}
        forecastInputMode={forecastInputMode}
      />
      {canPredict && forecastInputMode === ForecastInputType.Quantile && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
            {!!activeForecast &&
              activeForecast.distribution_input.type ===
                ForecastInputType.Quantile && (
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={withdrawalIsPending}
                  onClick={withdraw}
                >
                  {t("withdraw")}
                </Button>
              )}

            <PredictButton
              onSubmit={submit}
              isDirty={true}
              hasUserForecast={hasUserForecast}
              isPending={isPending}
              predictLabel={previousForecast ? undefined : t("predict")}
              isDisabled={
                !validateAllQuantileInputs({
                  question,
                  components: quantileDistributionComponents,
                  t,
                })
              }
            />
            {Object.values(quantileDistributionComponents[0] ?? {}).some(
              (value) => value?.isDirty === true
            ) && (
              <Button
                variant="secondary"
                type="submit"
                disabled={
                  !isDirty &&
                  !Object.values(quantileDistributionComponents[0] ?? {}).some(
                    (value) => value?.isDirty === true
                  )
                }
                onClick={handleDiscard}
              >
                {t("discard")}
              </Button>
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
        </>
      )}

      {forecastInputMode === ForecastInputType.Slider && (
        <div className="flex flex-col items-center justify-center">
          <QuestionUnresolveButton
            question={question}
            permission={permission}
          />
          {canResolve && (
            <QuestionResolutionButton
              question={question}
              permission={permission}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ForecastMakerContinuous;
