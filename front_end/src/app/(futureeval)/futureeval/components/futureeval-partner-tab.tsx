"use client";

import {
  faChartBar,
  faEnvelope,
  faFlask,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

const FutureEvalPartnerTab: React.FC = () => {
  return (
    <>
      <FutureEvalPartnerIntro />
      <FutureEvalPartnerOfferings />
      <FutureEvalPartnerCTA />
      <p
        className={cn(
          "m-0 text-center",
          FE_TYPOGRAPHY.body,
          FE_COLORS.textSubheading
        )}
      >
        Looking for something else?{" "}
        <Link
          href="/services"
          className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
        >
          See our other services
        </Link>
      </p>
    </>
  );
};

const FutureEvalPartnerIntro: React.FC = () => {
  return (
    <div className="space-y-6 text-center antialiased">
      <h3 className={cn("m-0", FE_TYPOGRAPHY.h1, FE_COLORS.textHeading)}>
        Work With Us
      </h3>
      <p
        className={cn(
          "m-0 mx-auto max-w-2xl font-sans text-base leading-[1.6] sm:text-lg",
          FE_COLORS.textSubheading
        )}
      >
        Wondering how you can access automated forecasts or evaluations on
        complex technological, societal, business, economic, or political
        questions? We help both organizations and researchers leverage the power
        of AI forecasting. If any of the below sounds interesting, please reach
        out!
      </p>
    </div>
  );
};

const OFFERINGS = [
  {
    icon: faChartBar,
    title: "Custom Model Evaluations",
    description:
      "We can set up a complete evaluation pipeline for LLMs or forecasting bots — including question creation, scoring, resolution, prompt optimization, and more — all tailored to your specific needs.",
  },
  {
    icon: faTrophy,
    title: "Run a Bot Tournament",
    description:
      "Set up your own tournament of questions and gather insight from our community of bot makers or internal bots. Tournaments can be public or private depending on your goals.",
  },
  {
    icon: faFlask,
    title: "Research Collaboration",
    description:
      "Collaborate with us on a research project — for example, testing bots on a specific class of questions in a MiniBench, or exploring novel evaluation methodologies together.",
  },
] as const;

const FutureEvalPartnerOfferings: React.FC = () => {
  return (
    <div className="space-y-8 antialiased">
      <h4
        className={cn(
          "m-0 text-center",
          FE_TYPOGRAPHY.h2,
          FE_COLORS.textHeading
        )}
      >
        What We Offer
      </h4>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {OFFERINGS.map((offering) => (
          <div
            key={offering.title}
            className={cn(
              "flex flex-1 flex-col items-start rounded-[10px] border p-8 antialiased",
              FE_COLORS.cardBorder,
              FE_COLORS.bgCard
            )}
          >
            <FontAwesomeIcon
              icon={offering.icon}
              className={cn("text-[26px]", FE_COLORS.textAccent)}
              aria-hidden
            />
            <h4
              className={cn(
                "m-0 mt-5",
                FE_TYPOGRAPHY.h4,
                FE_COLORS.textHeading
              )}
            >
              {offering.title}
            </h4>
            <p
              className={cn(
                "m-0 mt-2.5",
                FE_TYPOGRAPHY.body,
                FE_COLORS.textSubheading
              )}
            >
              {offering.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const FutureEvalPartnerCTA: React.FC = () => {
  const { setCurrentModal } = useModal();

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 rounded-[10px] px-6 py-10 text-center antialiased",
        FE_COLORS.bgSecondary
      )}
    >
      <h4 className={cn("m-0", FE_TYPOGRAPHY.h3, FE_COLORS.textHeading)}>
        Interested? Let&apos;s Talk
      </h4>
      <p
        className={cn(
          "m-0 max-w-xl",
          FE_TYPOGRAPHY.body,
          FE_COLORS.textSubheading
        )}
      >
        Whether you&apos;re looking for a one-off evaluation or an ongoing
        partnership, we&apos;d love to hear from you.
      </p>
      <button
        type="button"
        onClick={() => setCurrentModal({ type: "contactUs" })}
        className={cn(
          "mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 bg-transparent px-8 py-3 font-sans text-sm font-medium transition-opacity hover:opacity-80",
          FE_COLORS.borderPrimary,
          FE_COLORS.textAccent
        )}
      >
        <FontAwesomeIcon icon={faEnvelope} className="text-sm" aria-hidden />
        Contact Us
      </button>
    </div>
  );
};

export default FutureEvalPartnerTab;
