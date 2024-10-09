import React from "react";

interface VerbalForecastProps {
  forecast: number;
}

const getVerbalDescription = (forecast: number): string => {
  if (forecast < 0.4) return "Unlikely";
  if (forecast < 0.6) return "About Even";
  if (forecast < 0.8) return "Likely";
  return "Very Likely";
};

const VerbalForecast: React.FC<VerbalForecastProps> = ({ forecast }) => {
  return (
    <span className="font-semibold text-blue-800 dark:text-blue-300">
      {getVerbalDescription(forecast)}
    </span>
  );
};

export default VerbalForecast;
