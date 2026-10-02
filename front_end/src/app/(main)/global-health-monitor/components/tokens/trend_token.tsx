"use client";

import { GhmValueKey } from "../../config/questions";
import { useGhmValue } from "../ghm_data_provider";

/**
 * Picks its wording from the change since the previous edition, so qualitative
 * phrases ("rose to", "held at") stay true as live forecasts move.
 */
export function Trend({
  v,
  up,
  down,
  steady,
}: {
  v: GhmValueKey;
  up: string;
  down: string;
  steady: string;
}) {
  const direction = useGhmValue(v)?.change?.direction ?? "steady";
  const text = direction === "up" ? up : direction === "down" ? down : steady;

  return (
    <span data-ghm-trend={v} data-ghm-direction={direction}>
      {text}
    </span>
  );
}
