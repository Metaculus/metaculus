import {
  autoUpdate,
  flip,
  offset,
  Placement,
  shift,
  useClientPoint,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { useState } from "react";

type Props = {
  placement?: Placement;
  tooltipOffset?: number;
  x?: number | null;
  y?: number | null;
};

const useChartTooltip = ({
  placement = "left",
  tooltipOffset = 24,
  x,
  y,
}: Props = {}) => {
  const [isActive, setIsActive] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    strategy: "fixed",
    middleware: [
      offset(tooltipOffset),
      flip(),
      shift({ crossAxis: true, padding: 16 }),
    ],
    open: isActive,
    onOpenChange: setIsActive,
    placement,
    whileElementsMounted: autoUpdate,
  });
  const clientPoint = useClientPoint(context, { x, y });
  const dismiss = useDismiss(context);
  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    clientPoint,
    dismiss,
    hover,
  ]);

  return {
    isActive,
    refs,
    getReferenceProps,
    getFloatingProps,
    floatingStyles,
  };
};

export default useChartTooltip;
