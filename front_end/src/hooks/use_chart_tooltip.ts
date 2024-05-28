import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClientPoint,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { useState } from "react";

const useChartTooltip = () => {
  const [isActive, setIsActive] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    middleware: [
      offset(24),
      flip(),
      shift({ mainAxis: false, crossAxis: true }),
    ],
    open: isActive,
    onOpenChange: setIsActive,
    placement: "left",
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
