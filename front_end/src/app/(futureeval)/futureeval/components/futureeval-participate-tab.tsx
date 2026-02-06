"use client";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBolt,
  faBook,
  faBookOpen,
  faChartLine,
  faTrophy,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import videoThumbnail from "@/app/(main)/aib/assets/video-thumbnail.png";
import { SignupForm } from "@/components/auth/signup";
import BaseModal from "@/components/base_modal";
import { useAuth } from "@/contexts/auth_context";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

/**
 * FutureEval Participate Tab
 * Order: Video section, Submit Your Bot in 3 steps, Resources
 */
const FutureEvalParticipateTab: React.FC = () => {
  return (
    <>
      <FutureEvalSubmitSteps />
      <FutureEvalTournamentOverview />
      <FutureEvalResources />
    </>
  );
};

/**
 * Submit steps section with video
 */
const FutureEvalSubmitSteps: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateBot = () => {
    if (user) {
      router.push("/accounts/settings/bots/#create");
    } else {
      setModalOpen(true);
    }
  };

  const submitSteps = [
    <>
      <button
        type="button"
        className="underline"
        aria-label="Create an account"
        onClick={handleCreateBot}
      >
        Create an account
      </button>
      , make a bot when redirected to your settings page, and copy your access
      token.
    </>,
    <>
      Build your bot using our premade template in the{" "}
      <Link
        href="/notebooks/38928/futureeval-resources-page/#want-to-join-the-ai-forecasting-benchmark"
        className="underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        instructions
      </Link>{" "}
      provided.
    </>,
    "Watch your bot forecast and compete for prizes!",
  ] as const;

  return (
    <div className="flex flex-col gap-[60px] antialiased lg:flex-row lg:items-center">
      {/* Video section */}
      <div
        className={cn(
          "flex flex-1 flex-col items-center gap-[26px] rounded-lg p-8 md:mx-auto md:max-w-[432px] lg:mx-0 lg:max-w-none",
          FE_COLORS.bgSecondary
        )}
      >
        <p
          className={cn(
            "m-0 mx-auto max-w-[400px] text-center",
            FE_TYPOGRAPHY.h3,
            FE_COLORS.textHeading
          )}
        >
          Learn how to submit your forecasting bot in 30 minutes
        </p>

        <Link
          href="https://www.loom.com/share/fc3c1a643b984a15b510647d8f760685"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Watch the submission walkthrough video"
        >
          <Image
            src={videoThumbnail}
            alt="Submission walkthrough video thumbnail"
            width={468}
            height={263}
            unoptimized
          />
        </Link>
      </div>

      {/* Steps section */}
      <div className="my-6 flex-1">
        <h4
          className={cn(
            "m-0 mb-[55px] text-center",
            FE_TYPOGRAPHY.h2,
            FE_COLORS.textHeading
          )}
        >
          Submit Your Bot in 3 Steps
        </h4>
        <div className="flex flex-col gap-6">
          {submitSteps.map((step, index) => (
            <FutureEvalSubmitStep
              key={index}
              index={index + 1}
              content={step}
            />
          ))}
        </div>
      </div>

      {/* Signup modal for bot creation */}
      <BaseModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex max-h-full max-w-xl flex-col items-center">
          <h1 className="mx-auto mt-2 text-center text-blue-800 dark:text-blue-800-dark">
            {t("registrationHeadingSite")}
          </h1>
          <p className="mx-auto whitespace-pre-wrap text-center leading-normal opacity-75">
            {t("FABCreatePopupDescription")}
          </p>
          <div className="sm:w-80 sm:pr-4">
            <SignupForm redirectLocation="/accounts/settings/bots/#create" />
          </div>
          <div className="mt-6 text-balance px-4 text-center leading-normal text-gray-700 opacity-75 dark:text-gray-700-dark">
            {t.rich("registrationTerms", {
              terms: (chunks) => (
                <Link target="_blank" href={"/terms-of-use/"}>
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link target="_blank" href={"/privacy-policy/"}>
                  {chunks}
                </Link>
              ),
            })}
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

const FutureEvalSubmitStep: React.FC<{
  index: number;
  content: React.ReactNode;
}> = ({ index, content }) => {
  return (
    <div className="flex items-center gap-6">
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-[10px] font-sans font-medium text-futureeval-bg-light dark:text-futureeval-bg-dark",
          FE_COLORS.stepNumberBg
        )}
      >
        {index}
      </div>
      <p className={cn("m-0 text-base sm:text-lg", FE_COLORS.textSubheading)}>
        {content}
      </p>
    </div>
  );
};

/**
 * Tournament overview — 4 flat cards in a single grid
 */
const FutureEvalTournamentOverview: React.FC = () => {
  const tournaments = [
    {
      icon: faTrophy,
      title: "Seasonal Bot Tournament",
      tag: "~$50k · 3x/year",
      description:
        "Our primary tournament with ~4-month seasons starting every January, May, and September, each with 300–500 questions across all formats.",
      primary: true,
    },
    {
      icon: faBolt,
      title: "MiniBench",
      tag: "~$1k · bi-weekly",
      description:
        "Back-to-back 2-week rounds of ~60 auto-generated questions, designed for fast feedback loops and lowering the barrier to entry.",
      primary: true,
    },
    {
      icon: faChartLine,
      title: "Market Pulse",
      tag: "~$7k · bot-eligible",
      description:
        "Bots compete for prizes by continuously updating forecasts on numeric group questions throughout each question's lifetime.",
      primary: false,
    },
    {
      icon: faUsers,
      title: "Metaculus Cup",
      tag: "practice",
      description:
        "Test your bot against human forecasters on diverse questions — bots aren't prize-eligible but it's a great strength benchmark.",
      primary: false,
    },
  ] as const;

  return (
    <div className="space-y-8 antialiased">
      <h4
        className={cn(
          "m-0 text-center",
          FE_TYPOGRAPHY.h2,
          FE_COLORS.textHeading
        )}
      >
        Tournaments
      </h4>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tournaments.map((t) => (
          <div
            key={t.title}
            className={cn(
              "flex flex-col rounded-[10px] border p-5",
              t.primary
                ? cn(
                    FE_COLORS.borderPrimary,
                    FE_COLORS.bgCard,
                    "border-[1.5px]"
                  )
                : cn(FE_COLORS.cardBorder, FE_COLORS.bgCard)
            )}
          >
            <FontAwesomeIcon
              icon={t.icon}
              className={cn("self-start text-lg", FE_COLORS.textAccent)}
              aria-hidden
            />
            <h5
              className={cn(
                "m-0 mt-3",
                FE_TYPOGRAPHY.label,
                FE_COLORS.textHeading
              )}
            >
              {t.title}
            </h5>
            <p
              className={cn(
                "m-0 mt-0.5 text-xs font-semibold",
                FE_COLORS.textAccent
              )}
            >
              {t.tag}
            </p>
            <p
              className={cn(
                "m-0 mt-2",
                FE_TYPOGRAPHY.bodySmall,
                FE_COLORS.textSubheading
              )}
            >
              {t.description}
            </p>
          </div>
        ))}
      </div>

      <p
        className={cn(
          "m-0 text-center",
          FE_TYPOGRAPHY.bodySmall,
          FE_COLORS.textSubheading
        )}
      >
        To read more about each tournament, see our{" "}
        <Link
          href="/notebooks/38928/ai-benchmark-resources/#research-reports-and-overview-of-the-field"
          className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
        >
          resources page
        </Link>
        .
      </p>
    </div>
  );
};

/**
 * Resources section
 */
const FutureEvalResources: React.FC = () => {
  const RESOURCES_DATA = [
    {
      icon: faBook,
      title: "Bot Tournament Resources Page",
      description:
        "Everything you need to know about our bot tournaments including competition rules and set up instructions",
      href: "/notebooks/38928/futureeval-resources-page/",
    },
    {
      icon: faBookOpen,
      title: "Research Highlights",
      description:
        "Key findings, methodology papers, human baseline comparisons, and experiments",
      href: "/notebooks/38928/futureeval-resources-page/#research-reports-and-overview-of-the-field",
    },
    {
      icon: faTrophy,
      title: "Open Source Bots",
      description:
        "Start with a leg up by building off of what others have built and learning from past successes",
      href: "/notebooks/38928/futureeval-resources-page/#open-source-bots",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <h4
        className={cn(
          "m-0 text-center",
          FE_TYPOGRAPHY.h2,
          FE_COLORS.textHeading
        )}
      >
        Resources
      </h4>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {RESOURCES_DATA.map((resource, index) => (
          <FutureEvalResourceCard
            key={index}
            icon={resource.icon}
            title={resource.title}
            description={resource.description}
            href={resource.href}
          />
        ))}
      </div>
    </div>
  );
};

type ResourceCardProps = {
  icon: IconDefinition;
  title: string;
  description: string;
  href: string;
};

const FutureEvalResourceCard: React.FC<ResourceCardProps> = ({
  icon,
  title,
  description,
  href,
}) => {
  return (
    <Link
      href={href}
      aria-label={`${title} — open`}
      className={cn(
        "group block flex-1 rounded-[10px] no-underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-futureeval-primary-light dark:focus-visible:ring-futureeval-primary-dark"
      )}
    >
      <div
        className={cn(
          "flex h-full flex-1 flex-col items-start rounded-[10px] border p-8 antialiased transition",
          "group-hover:-translate-y-0.5 group-hover:shadow-md",
          FE_COLORS.cardBorder,
          FE_COLORS.bgCard
        )}
      >
        <FontAwesomeIcon
          icon={icon}
          className={cn("text-[26px] transition-colors", FE_COLORS.textAccent)}
          aria-hidden
        />
        <h4 className={cn("m-0 mt-5", FE_TYPOGRAPHY.h4, FE_COLORS.textHeading)}>
          {title}
        </h4>
        <p
          className={cn(
            "m-0 mt-2.5",
            FE_TYPOGRAPHY.body,
            FE_COLORS.textSubheading
          )}
        >
          {description}
        </p>
      </div>
    </Link>
  );
};

export default FutureEvalParticipateTab;
