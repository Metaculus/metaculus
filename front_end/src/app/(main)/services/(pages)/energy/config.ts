import { abbreviatedNumber } from "@/utils/formatters/number";

import { tournaments as financialTournaments } from "../financial-services/config";

export const metadata = {
  title: "Forecasting for Energy | Metaculus",
  description:
    "Optimize energy strategy with forecasting. Learn how energy companies partner with Metaculus to forecast renewable trends, policy changes, and market shifts.",
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
    "We help energy companies navigate the transition by forecasting technology adoption, policy impacts, and market dynamics reshaping the sector.",
  purpose: "for Energy",
};

export const solutions = {
  title: "Solutions for Energy",
  description:
    "Learn how forecasting can optimize your energy transition strategy.",
};

export const tournaments = {
  title: "Launch an Energy Forecasting Tournament",
  description:
    "Gain clarity on renewable adoption rates, policy changes, and technology breakthroughs driving the energy transition.",
  data: financialTournaments.data,
};

export const privateInstances = {
  title: "Private Instances for Energy Companies",
  description:
    "Deploy Metaculus for asset optimization, demand forecasting, and technology investment decisions.",
};

export const proForecasters = {
  title: "Pro Forecasters for Energy Analysis",
  firstPart:
    "Our Pro Forecasters track policy developments, technology costs, and market transitions.",
  secondPart:
    "These insights help you adapt and invest confidently in the energy transition.",
};
