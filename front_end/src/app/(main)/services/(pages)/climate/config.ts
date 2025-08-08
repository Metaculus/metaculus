import { abbreviatedNumber } from "@/utils/formatters/number";
import { tournaments as financialTournaments } from "../financial-services/config";

export const metadata = {
  title: "Forecasting for Climate | Metaculus",
  description:
    "Accelerate climate action and improve resilience through forecasting. Learn how climate organizations collaborate with Metaculus.",
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
    "We help climate-focused organizations make better decisions by forecasting technology breakthroughs, policy developments, and environmental outcomes critical to climate action.",
  purpose: "for Climate",
};

export const solutions = {
  title: "Solutions for Climate",
  description:
    "Learn how forecasting can accelerate climate action and improve resilience.",
};

export const tournaments = {
  title: "Launch a Climate Forecasting Tournament",
  description:
    "Gain clarity on decarbonization pathways, policy effectiveness, and technology viability through expert forecasting.",
  data: financialTournaments.data,
};

export const privateInstances = {
  title: "Private Instances for Climate Organizations",
  description:
    "Deploy Metaculus for project impact assessment, policy planning, and technology pathway optimization.",
};

export const proForecasters = {
  title: "Pro Forecasters for Climate Analysis",
  firstPart:
    "Our Pro Forecasters work with organizations like the Federation of American Scientists on climate policy and technology assessments.",
  secondPart: "",
};
