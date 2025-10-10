import * as React from "react";
import { VictoryLabel } from "victory";
import type { VictoryLabelProps } from "victory-core";

const estimateTextWidth = (text: string, fontSize: number) =>
  (text?.length ?? 0) * (fontSize || 12) * 0.55;

type Props = VictoryLabelProps & {
  chartWidth: number;
  padLeft: number;
  padRight: number;
  minGap?: number;
  fontSizePx?: number;
};

function resolveText(props: VictoryLabelProps): string {
  const t = props.text as unknown;

  if (Array.isArray(t)) return String((t as unknown[])[0] ?? "");

  if (typeof t === "function") {
    const fn = t as (p: unknown) => unknown;
    try {
      const result = fn({
        ...(props as Record<string, unknown>),
        datum: (props as Record<string, unknown>).datum,
        index: (props as Record<string, unknown>).index,
      });
      return String(result ?? "");
    } catch {
      return "";
    }
  }

  return String(t ?? "");
}

const toNumber = (
  v: VictoryLabelProps["x"] | VictoryLabelProps["dx"]
): number =>
  typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0;

const EdgeAwareLabel: React.FC<Props> = (props) => {
  const {
    chartWidth,
    padLeft,
    padRight,
    minGap = 8,
    fontSizePx = 12,
    x,
    dx,
    ...rest
  } = props;

  const xNum = toNumber(x);
  const dxPropNum = toNumber(dx);

  const label = resolveText(props);
  const w = estimateTextWidth(label, fontSizePx);

  const leftLimit = padLeft + 2;
  const rightLimit = chartWidth - padRight - 2;

  let textAnchor: "start" | "end" = "start";
  let dxFinal = dxPropNum || minGap;
  if (xNum + dxFinal + w > rightLimit) {
    textAnchor = "end";
    dxFinal = -minGap;
  }

  if (xNum + dxFinal - (textAnchor === "end" ? w : 0) < leftLimit) {
    textAnchor = "start";
    dxFinal = Math.max(minGap, leftLimit - xNum + 2);
  }

  return (
    <VictoryLabel
      {...rest}
      text={label}
      x={xNum}
      dx={dxFinal}
      textAnchor={textAnchor}
    />
  );
};

export default EdgeAwareLabel;
