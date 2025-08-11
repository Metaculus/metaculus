import { abbreviatedNumber } from "@/utils/formatters/number";

import { tournaments as financialTournaments } from "../financial-services/config";

export const metadata = {
  title: "Forecasting for Insurance | Metaculus",
  description:
    "Enhance underwriting and risk decisions using forecasting. Discover how insurance firms partner with Metaculus.",
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
    "We help insurers, reinsurers, and actuarial teams make better decisions by forecasting catastrophic events, regulatory changes, and emerging risks that impact your business.",
  purpose: "for Insurance",
};

export const solutions = {
  title: "Solutions for Insurance",
  description:
    "Learn how forecasting can enhance your underwriting and risk management.",
};

export const tournaments = {
  title: "Launch an Insurance Forecasting Tournament",
  description:
    "Gain clarity on catastrophe risks, regulatory changes, and market cycles through collective intelligence. We'll run the tournament and deliver actionable insights for underwriting decisions.",
  data: financialTournaments.data,
};

export const privateInstances = {
  title: "Private Instances for Insurers",
  description:
    "Deploy Metaculus within your organization to enhance actuarial modeling and combine expertise from underwriters, actuaries, and risk managers.",
};

export const proForecasters = {
  title: "Pro Forecasters for Risk Assessment",
  firstPart:
    "Engage our Pro Forecasters on catastrophe modeling, regulatory changes, or emerging perils.",
  secondPart:
    "Selected from the top 2% of forecasters with proven track records.",
};
