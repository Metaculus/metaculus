"use client";

import Link from "next/link";

import fall2025Icon from "@/app/(main)/aib/assets/tournaments/fall-2025.png";
import q12025Icon from "@/app/(main)/aib/assets/tournaments/q1-2025.png";
import q22024Icon from "@/app/(main)/aib/assets/tournaments/q2-2024.png";
import q22025Icon from "@/app/(main)/aib/assets/tournaments/q2-2025.png";
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
    href: "/tournament/fall-2025",
    img: fall2025Icon,
  },
  {
    title: "Q2 2025",
    href: "/tournament/q2-2025",
    img: q22025Icon,
  },
  {
    title: "Q1 2025",
    href: "/tournament/q1-2025",
    img: q12025Icon,
  },
  {
    title: "Q2 2024",
    href: "/tournament/q2-2024",
    img: q22024Icon,
  },
  {
    title: "Q3 2024",
    href: "/tournament/q3-2024",
    img: q22024Icon,
  },
  {
    title: "Q1 2024",
    href: "/tournament/q1-2024",
    img: q12025Icon,
  },
];

export default AIBInfoTournaments;
