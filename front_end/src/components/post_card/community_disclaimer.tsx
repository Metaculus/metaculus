"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import Button from "@/components/ui/button";
import { Project, TournamentType } from "@/types/projects";
import cn from "@/utils/cn";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  project: Project;
  variant?: "inline" | "standalone";
  fromCommunityFeed?: boolean;
  className?: string;
};

const getDisclaimerCopy = (
  t: ReturnType<typeof useTranslations>,
  project: Project
) => {
  if (project.type === TournamentType.Community) {
    return t.rich("communityDisclaimer", {
      community: () => (
        <Button
          href={getProjectLink(project)}
          variant="link"
          className="text-xs"
        >
          {project.name}
        </Button>
      ),
      learnMore: (child) => (
        <Button href="/faq/" variant="link" className="text-xs">
          {child}
        </Button>
      ),
    });
  }
  if (project.type === TournamentType.SiteMain) {
    return t("communityDisclaimerSiteMain");
  }

  return null;
};

const CommunityDisclaimer: FC<PropsWithChildren<Props>> = ({
  project,
  className,
  variant = "inline",
}) => {
  const t = useTranslations();

  const copy = getDisclaimerCopy(t, project);

  if (isNil(copy)) {
    return;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1 border border-blue-500 bg-blue-300 px-3 py-2.5 dark:border-blue-500-dark dark:bg-blue-300-dark",
        {
          "mx-2 -mb-1 rounded-t sm:mx-4": variant === "inline",
          rounded: variant === "standalone",
        },
        className
      )}
    >
      <p className="m-0 text-xs font-normal leading-5 text-gray-700 dark:text-gray-700-dark">
        {copy}
      </p>
    </div>
  );
};

export default CommunityDisclaimer;
