import { abbreviatedNumber } from "@/utils/formatters/number";

import { tournaments as financialTournaments } from "../financial-services/config";

export const metadata = {
  title: "Forecasting for Technology | Metaculus",
  description:
    "Forecast product launches, regulatory changes, and competitive dynamics. Discover how technology firms use Metaculus.",
};

export const statsList = [
  {
    label: "Predictions",
    value: `${abbreviatedNumber(2740000)}+`,
  },
  {
    label: "Forecasting Questions",
    value: `${abbreviatedNumber(19100)}+`,
  },
  {
    label: "Questions Resolved",
    value: `${abbreviatedNumber(9538)}+`,
  },
  {
    label: `11 years of predictions`,
    value: "",
  },
];

export const heading = {
  statsList,
  overview:
    "We help technology companies make better decisions by forecasting product launches, regulatory landscapes, and competitive dynamics that shape your market.",
  purpose: "for Technology",
};

export const solutions = {
  title: "Solutions for Technology",
  description:
    "Learn how forecasting can accelerate your product strategy and market intelligence.",
};

export const tournaments = {
  title: "Launch a Technology Forecasting Tournament",
  description:
    "Gain clarity on product timelines, regulatory changes, and competitive moves. We'll design questions specific to your technology domain and deliver strategic insights.",
  data: financialTournaments.data,
};

export const privateInstances = {
  title: "Private Instances for Tech Companies",
  description:
    "Deploy Metaculus to track product development, feature adoption, and engineering velocity across your teams.",
};

export const proForecasters = {
  title: "Pro Forecasters for Technology Analysis",
  firstPart:
    "Our Pro Forecasters include experts in AI, cybersecurity, and emerging tech.",
  secondPart:
    "They provide calibrated predictions on technology trends and market dynamics.",
};
