import { TournamentPreview } from "@/types/projects";

export const metadata = {
  title: "Forecasting for Pharmaceutical | Metaculus",
  description:
    "Improve trial outcomes and regulatory strategy with forecasting. Learn how pharma companies use Metaculus.",
};

export const heading = {
  overview:
    "We help pharmaceutical companies make better decisions by forecasting clinical trial success, regulatory approvals, and market dynamics throughout drug development.",
  purpose: "for Pharmaceutical Forecasting",
};

export const solutions = {
  title: "Solutions for Pharmaceutical",
  description:
    "Learn how forecasting can improve pipeline decisions and regulatory strategy.",
};

export const tournaments = {
  title: "Launch a Pharma Forecasting Tournament",
  description:
    "Gain clarity on trial outcomes, approval timelines, and competitive pipeline developments through expert crowd forecasting.",
  data: [
    {
      id: "biosecurity",
      name: "Biosecurity Tournament",
      prize_pool: 25000,
      questions_count: 38,
      forecasts_count: 9107,
      header_image: null,
      slug: "biosecurity-tournament",
    },
    {
      id: "flusight",
      name: "FluSight Challenge",
      prize_pool: 5000,
      questions_count: 40,
      forecasts_count: 4806,
      header_image: null,
      slug: "flusight-challenge",
    },
    {
      id: "respiratory-outlook",
      name: "Respiratory Outlook",
      prize_pool: null,
      questions_count: 84,
      forecasts_count: 11623,
      header_image: null,
      slug: "respiratory-outlook",
    },
    {
      id: "ai-drug-discovery",
      name: "AI Drug Discovery",
      prize_pool: null,
      questions_count: null,
      forecasts_count: null,
      header_image: null,
      slug: "ai-drug-discovery",
    },
  ] as unknown as TournamentPreview[],
};

export const privateInstances = {
  title: "Private Instances for Pharma",
  description:
    "Deploy GxP-compliant forecasting for portfolio optimization and clinical development decisions.",
};

export const proForecasters = {
  title: "Pro Forecasters for Drug Development",
  firstPart:
    "Our Pro Forecasters include experts with regulatory and clinical backgrounds.",
  secondPart:
    "They understand FDA processes and trial design to support better drug development decisions.",
};
