"use client";

import Link from "next/link";

import ReusableGradientCarousel from "@/components/gradient-carousel";

import AIBInfoTournamentCard from "./aib-info-tournament-card";

const AIBInfoTournaments: React.FC = () => {
  return (
    <div className="flex flex-col">
      <h4 className="m-0 mb-5 text-center text-2xl font-bold leading-[116%] text-blue-800 dark:text-blue-800-dark md:text-4xl">
        Benchmarking Tournaments
      </h4>

      <ReusableGradientCarousel<(typeof CARDS_DATA)[0]>
        items={CARDS_DATA}
        renderItem={(card) => <AIBInfoTournamentCard {...card} />}
      />

      <div
        className="mt-6 rounded-[10px] p-4"
        style={{ backgroundColor: "rgba(169, 192, 214, 0.30)" }}
      >
        <p className="m-0 text-center text-sm font-medium text-blue-800 antialiased dark:text-blue-800-dark md:text-lg">
          Make sure to check out{" "}
          <Link href="/tournament/minibench-2025-09-01/">MiniBench</Link>, our
          shorter-term experimental Bot Tournament!
        </p>
      </div>
    </div>
  );
};

const CARDS_DATA = [
  {
    title: "Fall 2025",
    href: "/aib/2025/fall",
    imgUrl: "https://metaculus-web-media.s3.amazonaws.com/aib-q3.webp",
    prize: "$58,000",
    isLive: true,
  },
  {
    title: "Q2 2025",
    href: "/aib/2025/q2",
    imgUrl: "https://metaculus-web-media.s3.amazonaws.com/aib-q2.webp",
    prize: "$30,000",
  },
  {
    title: "Q1 2025",
    href: "/aib/2025/q1",
    imgUrl: "https://metaculus-web-media.s3.amazonaws.com/2025-q1.webp",
    prize: "$30,000",
  },
  {
    title: "Q4 2024",
    href: "/aib/2024/q4",
    imgUrl: "https://metaculus-media.s3.amazonaws.com/hires-q4.webp",
    prize: "$30,000",
  },
  {
    title: "Q3 2024",
    href: "/aib/2024/q3",
    imgUrl: "https://metaculus-media.s3.amazonaws.com/hires-bw.webp",
    prize: "$30,000",
  },
];

export default AIBInfoTournaments;
