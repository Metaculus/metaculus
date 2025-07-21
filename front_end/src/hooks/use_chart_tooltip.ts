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
};

const useChartTooltip = ({
  placement = "left",
  tooltipOffset = 24,
}: Props = {}) => {
  const [isActive, setIsActive] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    middleware: [
      offset(tooltipOffset),
      flip(),
      shift({ mainAxis: false, crossAxis: true }),
    ],
    open: isActive,
    onOpenChange: setIsActive,
    placement,
    whileElementsMounted: autoUpdate,
  });
  const clientPoint = useClientPoint(context);
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
