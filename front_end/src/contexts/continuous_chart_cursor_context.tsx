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
  activeUserForecastValues: number[] | null;
  setActiveUserForecastValues: (v: number[] | null) => void;
};

const ContinuousChartCursorContext = createContext<CursorContextValue | null>(
  null
);

export const ContinuousChartCursorProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeForecast, setActiveForecast] =
    useState<NumericAggregateForecast | null>(null);
  const [activeUserForecastValues, setActiveUserForecastValues] = useState<
    number[] | null
  >(null);

  const stableSet = useCallback(
    (f: NumericAggregateForecast | null) => setActiveForecast(f),
    []
  );
  const stableSetUser = useCallback(
    (v: number[] | null) => setActiveUserForecastValues(v),
    []
  );

  const value = useMemo(
    () => ({
      activeForecast,
      setActiveForecast: stableSet,
      activeUserForecastValues,
      setActiveUserForecastValues: stableSetUser,
    }),
    [activeForecast, stableSet, activeUserForecastValues, stableSetUser]
  );
  return (
    <ContinuousChartCursorContext.Provider value={value}>
      {children}
    </ContinuousChartCursorContext.Provider>
  );
};

export const useContinuousChartCursor = () =>
  useContext(ContinuousChartCursorContext);
