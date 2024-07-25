"use client";
import Link from "next/link";
import { useState } from "react";

import MultiSlider, {
  MultiSliderValue,
} from "@/components/sliders/multi_slider";
import Slider from "@/components/sliders/slider";
import { binWeightsFromSliders, computeQuartilesFromCDF } from "@/utils/math";

export default function Questions() {
  const [multiSliderValue, setMultiSliderValue] = useState<MultiSliderValue>({
    left: 116,
    center: 203,
    right: 232,
  });
  const [sliderValue, setSliderValue] = useState(50);

  const dataset = binWeightsFromSliders(0.4, 0.7, 0.8, false, true);
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
        value={multiSliderValue}
        step={1}
        clampStep={10}
        onChange={setMultiSliderValue}
      />
      Slider:
      <Slider
        inputMin={0}
        inputMax={100}
        step={0.1}
        defaultValue={sliderValue}
        onChange={setSliderValue}
      />
    </main>
  );
}
