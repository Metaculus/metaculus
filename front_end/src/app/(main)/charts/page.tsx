"use client";
import Link from "next/link";
import { useState } from "react";

import MultiSlider, {
  MultiSliderValue,
} from "@/components/sliders/multi_slider";
import Slider from "@/components/sliders/slider";
import { binWeightsFromSliders, computeQuartilesFromCDF } from "@/utils/math";
import {
  generateMockMultipleChoiceChart,
  generateMockNumericChart,
} from "@/utils/mock_charts";

export default function Questions() {
  const numericDataset = generateMockNumericChart();
  const multipleChoiceDataset = generateMockMultipleChoiceChart();

  const [multiSliderValue, setMultiSliderValue] = useState<MultiSliderValue>({
    left: 116,
    center: 203,
    right: 232,
  });
  const [sliderValue, setSliderValue] = useState(50);

  const dataset = binWeightsFromSliders(0.4, 0.7, 0.8);
  const quantiles = computeQuartilesFromCDF(dataset.cdf);

  return (
    <main className="flex flex-col gap-2 p-6">
      <Link
        href={"/"}
        className={"self-start font-bold text-blue-800 hover:opacity-60"}
      >
        Home
      </Link>
      Multi slider:
      <MultiSlider
        min={10}
        max={300}
        value={multiSliderValue}
        step={0.1}
        onChange={setMultiSliderValue}
      />
      Slider:
      <Slider
        min={0}
        max={100}
        step={0.1}
        defaultValue={sliderValue}
        onChange={setSliderValue}
      />
    </main>
  );
}
