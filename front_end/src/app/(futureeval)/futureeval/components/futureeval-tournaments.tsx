"use client";

import Link from "next/link";

import ReusableGradientCarousel from "@/components/gradient-carousel";
import cn from "@/utils/core/cn";

import FutureEvalInfoTournamentCard from "./futureeval-info-tournament-card";
import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

/**
 * FutureEval-specific tournaments section with consistent theming.
 * TODO: Check if we can automatically fetch the tournaments
 */
const FutureEvalTournaments: React.FC = () => {
  const CARDS_DATA = [
    {
      title: "Spring 2026",
      href: "/aib/2026/spring",
      imgUrl: "https://cdn.metaculus.com/hires-spring.webp",
      prize: "$58,000",
      isLive: true,
    },
    {
      title: "Fall 2025",
      href: "/aib/2025/fall",
      imgUrl: "https://cdn.metaculus.com/aib-q3.webp",
      prize: "$58,000",
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
    <div id="tournaments" className="flex scroll-mt-24 flex-col">
      <h3 className={cn("text-left", FE_TYPOGRAPHY.h2, FE_COLORS.textHeading)}>
        Bot tournaments
      </h3>

      <div className="mt-3">
        <ReusableGradientCarousel<(typeof CARDS_DATA)[number]>
          items={CARDS_DATA}
          renderItem={(card) => <FutureEvalInfoTournamentCard {...card} />}
          listClassName="-ml-2"
          gradientFromClass={FE_COLORS.gradientFrom}
        />
      </div>

      <div className={cn("mt-6 rounded-[10px] p-4", FE_COLORS.bgSecondary)}>
        <p
          className={cn(
            "m-0 text-center antialiased",
            FE_TYPOGRAPHY.body,
            FE_COLORS.textSubheading
          )}
        >
          Make sure to check out{" "}
          <Link
            href="/aib/minibench/"
            className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
          >
            MiniBench
          </Link>
          , our bot tournament series for fast feedback loops!
        </p>
      </div>
    </div>
  );
};

export default FutureEvalTournaments;
