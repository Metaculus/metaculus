"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useMemo, useState } from "react";

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
  DistributionSliderComponent,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getCdfBounds } from "@/utils/charts";
import {
  extractPrevNumericForecastValue,
  getNormalizedContinuousForecast,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import { sendGAPredictEvent } from "./ga_events";
import { useHideCP } from "../../cp_provider";
import ContinuousSlider from "../continuous_slider";
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
  const activeForecastSliderValues = activeForecast
    ? extractPrevNumericForecastValue(activeForecast.distribution_input)
    : undefined;
  const withCommunityQuartiles = !user || !hideCP;
  const hasUserForecast = !!activeForecastSliderValues;
  const t = useTranslations();
  const [distributionComponents, setDistributionComponents] = useState<
    DistributionSliderComponent[]
  >(getNormalizedContinuousForecast(activeForecastSliderValues?.components));
  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast?.forecast_values &&
        !previousForecast.distribution_input
    );
  const [forecastInputMode, setForecastInputMode] =
    useState<ForecastInputType>("slider");

  const dataset = useMemo(
    () =>
      getNumericForecastDataset(
        distributionComponents,
        question.open_lower_bound,
        question.open_upper_bound
      ),
    [
      distributionComponents,
      question.open_lower_bound,
      question.open_upper_bound,
    ]
  );

  const userCdf: number[] = dataset.cdf;
  const userPreviousCdf: number[] | undefined =
    overlayPreviousForecast && previousForecast
      ? previousForecast.forecast_values
      : undefined;
  const latest = question.aggregations.recency_weighted.latest;
  const communityCdf: number[] | undefined =
    latest && !latest.end_time ? latest?.forecast_values : undefined;

  const handleAddComponent = () => {
    setDistributionComponents([
      ...distributionComponents,
      {
        left: 0.4,
        right: 0.6,
        center: 0.5,
        weight: 1,
      },
    ]);
  };

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);
    sendGAPredictEvent(post, question, hideCP);

    const response = await createForecasts(post.id, [
      {
        questionId: question.id,
        forecastData: {
          continuousCdf: userCdf,
          probabilityYes: null,
          probabilityYesPerCategory: null,
        },
        distributionInput: {
          type: "slider",
          components: distributionComponents,
        },
      },
    ]);
    setIsDirty(false);
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
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
  return (
    <>
      <ContinuousSlider
        components={distributionComponents}
        dataset={dataset}
        onChange={(components) => {
          setDistributionComponents(components);
          setIsDirty(true);
        }}
        overlayPreviousForecast={overlayPreviousForecast}
        setOverlayPreviousForecast={setOverlayPreviousForecast}
        question={question}
        disabled={!canPredict}
        // showInputModeSwitcher
        forecastInputMode={forecastInputMode}
        setForecastInputMode={setForecastInputMode}
      />

      {canPredict && forecastInputMode === "slider" && (
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
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
        </div>
      )}
      {forecastInputMode === "slider" ? (
        <NumericForecastTable
          question={question}
          userBounds={getCdfBounds(userCdf)}
          userQuartiles={userCdf ? computeQuartilesFromCDF(userCdf) : undefined}
          userPreviousBounds={getCdfBounds(userPreviousCdf)}
          userPreviousQuartiles={
            userPreviousCdf
              ? computeQuartilesFromCDF(userPreviousCdf)
              : undefined
          }
          communityBounds={getCdfBounds(communityCdf)}
          communityQuartiles={
            communityCdf ? computeQuartilesFromCDF(communityCdf) : undefined
          }
          withCommunityQuartiles={withCommunityQuartiles}
          isDirty={isDirty}
          hasUserForecast={hasUserForecast}
        />
      ) : (
        <div>There will be a table inputs</div>
      )}

      {forecastInputMode === "slider" && (
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
