"use client";
import Link from "next/link";

import NumericPickerChart from "@/components/charts/numeric_picker_chart";
import NumericPickerSlider from "@/components/charts/numeric_picker_slider";
import MultipleChoiceChartCard from "@/components/detailed_question_card/multiple_choice_chart_card";
import NumericChartCard from "@/components/detailed_question_card/numeric_chart_card";
import { QuestionType } from "@/types/question";
import {
  generateMockMultipleChoiceChart,
  generateMockNumericChart,
} from "@/utils/mock_charts";

export default function Questions() {
  const numericDataset = generateMockNumericChart();
  const multipleChoiceDataset = generateMockMultipleChoiceChart();

  return (
    <main className="flex flex-col gap-2 p-6">
      <Link
        href={"/"}
        className={"self-start font-bold text-metac-blue-800 hover:opacity-60"}
      >
        Home
      </Link>
      Numeric prediction maker + slider
      <NumericPickerChart
        min={10}
        max={300}
        left={0.4}
        center={0.7}
        right={0.8}
      />
      <NumericPickerSlider onSliderChange={() => {}} />
      Numeric Chart:
      <NumericChartCard
        forecast={numericDataset}
        questionType={QuestionType.Numeric}
      />
      Multiple Choice Chart:
      <MultipleChoiceChartCard forecast={multipleChoiceDataset} />
    </main>
  );
}
