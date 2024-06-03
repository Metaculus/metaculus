import { MultipleChoiceForecast, NumericForecast } from "@/types/question";

export function getForecastPctDisplayValue(value: number | string) {
  return `${Math.round(Number(value) * 100)}%`;
}

export function getForecastNumericDisplayValue(value: number | string) {
  return Number(value).toFixed(1);
}

export function getIsForecastEmpty(
  forecast: MultipleChoiceForecast | NumericForecast | null | undefined
): forecast is null {
  return (
    !forecast ||
    Object.values(forecast).some((value) => !value || !value.length)
  );
}
