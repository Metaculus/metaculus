import { useCallback, useState } from "react";

import { TickFormat } from "@/types/charts";

const useTimestampCursor = (timestamps: number[]) => {
  const [cursorTimestamp, setCursorTimestamp] = useState(
    timestamps[timestamps.length - 1]
  );
  const [tooltipDate, setTooltipDate] = useState("");

  const handleCursorChange = useCallback(
    (value: number, format: TickFormat) => {
      setCursorTimestamp(value);
      setTooltipDate(format(value));
    },
    []
  );

  return [cursorTimestamp, tooltipDate, handleCursorChange] as const;
};

export default useTimestampCursor;
