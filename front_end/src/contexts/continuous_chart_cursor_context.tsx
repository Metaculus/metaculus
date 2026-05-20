"use client";

import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { NumericAggregateForecast } from "@/types/question";

type CursorContextValue = {
  activeForecast: NumericAggregateForecast | null;
  setActiveForecast: (f: NumericAggregateForecast | null) => void;
};

const ContinuousChartCursorContext = createContext<CursorContextValue | null>(
  null
);

export const ContinuousChartCursorProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeForecast, setActiveForecast] =
    useState<NumericAggregateForecast | null>(null);
  const stableSet = useCallback(
    (f: NumericAggregateForecast | null) => setActiveForecast(f),
    []
  );
  const value = useMemo(
    () => ({ activeForecast, setActiveForecast: stableSet }),
    [activeForecast, stableSet]
  );
  return (
    <ContinuousChartCursorContext.Provider value={value}>
      {children}
    </ContinuousChartCursorContext.Provider>
  );
};

export const useContinuousChartCursor = () =>
  useContext(ContinuousChartCursorContext);
