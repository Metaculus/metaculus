"use client";

import {
  faBook,
  faBookOpen,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";

import AIBResourceCard from "./aib-info-resource-card";

const AIBInfoResources: React.FC = () => {
  const t = useTranslations();

  const RESOURCES_DATA = [
    {
      icon: faBook,
      title: t("aibResourcesFullInfoTitle"),
      description: t("aibResourcesFullInfoDesc"),
      href: "/notebooks/38928/futureeval-resources-page/",
    },
    {
      icon: faBookOpen,
      title: t("aibResourcesHighlightsTitle"),
      description: t("aibResourcesHighlightsDesc"),
      href: "/notebooks/38928/futureeval-resources-page/#research-reports-and-overview-of-the-field",
    },
    {
      icon: faTrophy,
      title: t("aibResourcesLeaderboardsTitle"),
      description: t("aibResourcesLeaderboardsDesc"),
      href: "/futureeval/leaderboard",
    },
  ] as const;

  return (
    <div className="space-y-8 sm:pt-5 lg:pt-10 2xl:pt-0">
      <h4 className="m-0 text-center text-4xl font-bold text-blue-800 dark:text-blue-800-dark">
        {t("aibResourcesHeading")}
      </h4>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {RESOURCES_DATA.map((resource, index) => (
          <AIBResourceCard
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

export default AIBInfoResources;
