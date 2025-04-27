"use client";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import { ContinuousForecastInputType } from "@/types/charts";
import {
  DefaultInboundOutcomeCount,
  DistributionSliderComponent,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getSliderNumericForecastDataset } from "@/utils/forecasts/dataset";
import { getNormalizedContinuousForecast } from "@/utils/forecasts/helpers";

import ContinuousInput from ".";

type Props = {
  question: QuestionWithNumericForecasts;
};

const ExampleContinuousInput: FC<Props> = ({ question }) => {
  const [isDirty, setIsDirty] = useState(false);
  const t = useTranslations();
  const [sliderDistributionComponents, setSliderDistributionComponents] =
    useState<DistributionSliderComponent[]>(
      getNormalizedContinuousForecast(undefined)
    );

  const dataset = useMemo(() => {
    return getSliderNumericForecastDataset(
      sliderDistributionComponents,
      question.open_lower_bound,
      question.open_upper_bound,
      question.inbound_outcome_count ?? DefaultInboundOutcomeCount
    );
  }, [sliderDistributionComponents, question]);

  const userCdf: number[] = dataset.cdf;
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

  const handleDiscard = () => {
    setSliderDistributionComponents(getNormalizedContinuousForecast(undefined));
    setIsDirty(false);
  };

  const SubmitControls: ReactNode = (
    <div className="my-5 flex flex-wrap items-center justify-center gap-3 px-4">
      <Button variant="secondary" type="reset" onClick={handleAddComponent}>
        {t("addComponentButton")}
      </Button>

      {isDirty && (
        <Button variant="secondary" type="submit" onClick={handleDiscard}>
          {t("discard")}
        </Button>
      )}
    </div>
  );

  return (
    <>
      <ContinuousInput
        question={question}
        dataset={dataset}
        userCdf={userCdf}
        userPreviousCdf={undefined}
        communityCdf={undefined}
        sliderComponents={sliderDistributionComponents}
        onSliderChange={(components) => {
          setSliderDistributionComponents(components);
          setIsDirty(true);
        }}
        quantileComponent={[]}
        onQuantileChange={() => {}}
        overlayPreviousForecast={false}
        onOverlayPreviousForecastChange={() => {}}
        inputMode={ContinuousForecastInputType.Slider}
        onInputModeChange={() => {}}
        hasUserForecast={false}
        isDirty={isDirty}
        submitControls={SubmitControls}
        disabled={false}
        disableInputModeSwitch={true}
      />
    </>
  );
};

export default ExampleContinuousInput;
