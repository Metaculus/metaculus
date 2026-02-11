import React from "react";

import { ServiceType } from "@/constants/services";

import { ServiceOption } from "../../../components/contact_section/contact_form";

export const metadata = {
  title: "Metaculus Pro Forecasters for Financial Services",
  description:
    "Put proven financial forecasters to work on your most important questions. Get calibrated predictions on market timing, portfolio risk, and regulatory changes—paired with transparent reasoning.",
};

export const title = "Metaculus Pro Forecasters for Financial Services";

export const description = {
  firstPart:
    "With more than 11,000 resolved questions including thousands on market movements, economic indicators, and financial risks, Metaculus has the data to spot forecasting excellence and the power to put proven financial experts to work on your most important investment challenges.",
  secondPart:
    "Pro Forecasters deliver calibrated predictions on market timing, portfolio risks, and regulatory changes paired with clear reasoning, empowering portfolio managers and risk officers to act with confidence.",
};

export const howItWorksDescription =
  "Steps for collaborating with Pro Forecasters on financial analysis";

export const steps = [
  {
    title: "Contact Us",
    description:
      "We'll explore how our Pro Forecasters can best surface the market insights, risk assessments, and regulatory intelligence you need.",
    titleClassName: "lg:pr-10",
  },
  {
    title: "Identify key financial questions",
    description:
      "Whether it's analyzing market volatility, assessing credit risks, or anticipating regulatory changes, we'll help you target the financial intelligence you need for investment decisions.",
  },
  {
    title: "Learn from Financial Pros",
    description:
      "With a carefully selected team of former traders, risk managers, and financial analysts on your timeline, Pros will share calibrated market forecasts and investment reasoning to help you make the right calls when it matters most.",
  },
];

export const caseStudy = {
  title: "Metaculus Pro Forecasters",
  description: {
    firstPart: "Monthly reports shared with institutional clients.",
    secondPart: (
      <a href="#contact-us" className="underline">
        View Sample Report
      </a>
    ),
  },
};

export const serviceOptions: ServiceOption[] = [
  {
    value: ServiceType.MARKET_TIMING_AND_TRADING_SIGNALS,
    labelKey: "marketTimingAndTradingSignals",
  },
  {
    value: ServiceType.PORTFOLIO_RISK_ASSESSMENT,
    labelKey: "portfolioRiskAssessment",
  },
  {
    value: ServiceType.REGULATORY_IMPACT_ANALYSIS,
    labelKey: "regulatoryImpactAnalysis",
  },
  {
    value: ServiceType.CREDIT_RISK_EVALUATION,
    labelKey: "creditRiskEvaluation",
  },
  {
    value: ServiceType.MA_AND_CORPORATE_ACTIONS,
    labelKey: "maAndCorporateActions",
  },
  {
    value: ServiceType.ECONOMIC_INDICATOR_FORECASTING,
    labelKey: "economicIndicatorForecasting",
  },
  {
    value: ServiceType.OTHER_FINANCIAL_FORECASTING,
    labelKey: "otherFinancialForecasting",
  },
];
