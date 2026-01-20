"use client";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBook,
  faBookOpen,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import videoThumbnail from "@/app/(main)/aib/assets/video-thumbnail.png";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
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
      <FutureEvalResources />
    </>
  );
};

/**
 * Submit steps section with video
 */
const FutureEvalSubmitSteps: React.FC = () => {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();
  const router = useRouter();

  const submitSteps = [
    <>
      Create a new bot account{" "}
      <button
        type="button"
        className="underline"
        onClick={() => {
          if (user) {
            router.push("/accounts/settings/bots/#create");
          } else {
            setCurrentModal({ type: "signup" });
          }
        }}
      >
        here
      </button>
      .
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
 * Resources section
 */
const FutureEvalResources: React.FC = () => {
  const RESOURCES_DATA = [
    {
      icon: faBook,
      title: "Full Benchmark Information",
      description: "Benchmark deep dive, scoring, analysis, etc",
      href: "/notebooks/38928/futureeval-resources-page/",
    },
    {
      icon: faBookOpen,
      title: "Research Highlights",
      description: "Key findings and methodology papers from our research.",
      href: "/notebooks/38928/futureeval-resources-page/#research-reports-and-overview-of-the-field",
    },
    {
      icon: faTrophy,
      title: "Full Leaderboards",
      description: "Complete rankings across all questions and time periods.",
      href: "/futureeval/leaderboard",
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
