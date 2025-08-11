import { TournamentPreview } from "@/types/projects";

export const metadata = {
  title: "Forecasting for Financial Services | Metaculus",
  description:
    "Make investment and risk decisions with greater confidence using Metaculus forecasting.",
};

export const heading = {
  overview:
    "We help financial institutions and investment firms make better decisions by forecasting market movements, regulatory changes, and risk events that matter.",
  purpose: "for Financial Services",
};

export const solutions = {
  title: "Solutions for Financial Services",
  description:
    "Learn about ways you can work with us to enhance your risk management and investment decisions.",
};

export const tournaments = {
  title: "Launch a Financial Forecasting Tournament",
  description:
    "Gain clarity on market timing, regulatory compliance, and portfolio risk through collective intelligence. We'll run the tournament and deliver actionable insights for your investment strategy.",
  data: [
    {
      id: "bridgewater",
      name: "Bridgewater Forecasting Contest",
      prize_pool: 25000,
      questions_count: 50,
      forecasts_count: 161020,
      header_image: null,
      slug: "bridgewater-forecasting-contest",
    },
    {
      id: "market-pulse",
      name: "Market Pulse Challenge 25Q2",
      prize_pool: 7500,
      questions_count: 45,
      forecasts_count: 11172,
      header_image: null,
      slug: "market-pulse-25q2",
    },
    {
      id: "fiscal-showdown",
      name: "Fiscal Showdown 2025",
      prize_pool: 5000,
      questions_count: 19,
      forecasts_count: 4827,
      header_image: null,
      slug: "fiscal-showdown-2025",
    },
    {
      id: "ai-benchmark",
      name: "AI Forecasting Benchmark",
      prize_pool: 30000,
      questions_count: 348,
      forecasts_count: 32228,
      header_image: null,
      slug: "ai-forecasting-benchmark",
    },
  ] as unknown as TournamentPreview[],
};

export const privateInstances = {
  title: "Private Instances for Financial Institutions",
  description:
    "Deploy the Metaculus platform within your investment firm, bank, or hedge fund to surface market insights and seamlessly combine the expertise from your trading desks, risk management teams, and analysts.",
};

export const proForecasters = {
  title: "Pro Forecasters for Financial Analysis",
  firstPart:
    "Engage Metaculus Pro Forecasters on critical financial questions—whether for portfolio allocation, risk assessment, or regulatory compliance planning.",
  secondPart:
    "Our most accurate forecasters deliver calibrated predictions on market movements, credit risks, and regulatory changes paired with clear reasoning, empowering portfolio managers and risk officers to act with confidence.",
};
