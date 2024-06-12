import { isNil } from "lodash";
import { useCallback, useEffect, useState } from "react";

type Params = {
  prevForecast?: any;
  value?: number | null;
};

const useSliderForecast = (params?: Params) => {
  const { prevForecast, value } = params ?? {};

  const prevForecastValue =
    typeof prevForecast === "number"
      ? normalizeForecastValue(prevForecast)
      : null;

  const [forecast, setForecast] = useState<number | null>(prevForecastValue);
  const [isForecastDirty, setIsForecastDirty] = useState(
    prevForecastValue !== null
  );
  const [inputValue, setInputValue] = useState(
    prevForecastValue ? `${prevForecastValue}%` : "—"
  );

  useEffect(() => {
    if (!isNil(value)) {
      setForecast(value);
      setInputValue(value.toString() + "%");
      setIsForecastDirty(true);
    }
  }, [value]);

  const handleSliderForecastChange = useCallback((value: number) => {
    setForecast(value);
    setInputValue(value.toString() + "%");
    setIsForecastDirty(true);
  }, []);
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setIsForecastDirty(true);
  }, []);
  const handleInputForecastChange = useCallback((value: number) => {
    setForecast(value);
    setIsForecastDirty(true);
  }, []);

  return {
    forecast,
    inputValue,
    isForecastDirty,
    handleSliderForecastChange,
    handleInputChange,
    handleInputForecastChange,
  };
};

const normalizeForecastValue = (value: number) => {
  return value * 100;
};

export default useSliderForecast;
