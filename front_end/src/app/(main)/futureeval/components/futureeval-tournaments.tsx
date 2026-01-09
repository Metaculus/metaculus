"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import AIBInfoTournamentCard from "@/app/(main)/aib/components/aib/tabs/info/aib-info-tournament-card";
import ReusableGradientCarousel from "@/components/gradient-carousel";
import cn from "@/utils/core/cn";

import { FE_COLORS } from "../theme";

/**
 * FutureEval-specific tournaments section with consistent theming.
 * Uses the violet gradient for the carousel and matching text colors.
 */
const FutureEvalTournaments: React.FC = () => {
  const t = useTranslations();

  const CARDS_DATA = [
    {
      title: "Fall 2025",
      href: "/aib/2025/fall",
      imgUrl: "https://cdn.metaculus.com/aib-q3.webp",
      prize: "$58,000",
      isLive: true,
    },
    {
      title: "Q2 2025",
      href: "/aib/2025/q2",
      imgUrl: "https://cdn.metaculus.com/aib-q2.webp",
      prize: "$30,000",
    },
    {
      title: "Q1 2025",
      href: "/aib/2025/q1",
      imgUrl: "https://cdn.metaculus.com/2025-q1.webp",
      prize: "$30,000",
    },
    {
      title: "Q4 2024",
      href: "/aib/2024/q4",
      imgUrl: "https://cdn.metaculus.com/hires-q4.webp",
      prize: "$30,000",
    },
    {
      title: "Q3 2024",
      href: "/aib/2024/q3",
      imgUrl: "https://cdn.metaculus.com/hires-bw.webp",
      prize: "$30,000",
    },
  ];

  return (
    <div className="flex flex-col">
      <h4
        className={cn(
          "m-0 mb-5 text-center text-[24px] font-bold leading-[116%] sm:text-[32px] sm:leading-[40px] lg:text-4xl",
          FE_COLORS.textHeading
        )}
      >
        {t("aibTournamentsHeading")}
      </h4>

      <ReusableGradientCarousel<(typeof CARDS_DATA)[number]>
        items={CARDS_DATA}
        renderItem={(card) => <AIBInfoTournamentCard {...card} />}
        listClassName="-ml-2"
        gradientFromClass={FE_COLORS.gradientFrom}
      />

      <div className={cn("mt-6 rounded-[10px] p-4", FE_COLORS.bgSecondary)}>
        <p
          className={cn(
            "m-0 text-center font-geist-mono text-sm antialiased sm:text-base",
            FE_COLORS.textSubheading
          )}
        >
          {t.rich("aibMiniBenchBanner", {
            link: (chunks) => (
              <Link href="/aib/minibench/" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
};

export default FutureEvalTournaments;
