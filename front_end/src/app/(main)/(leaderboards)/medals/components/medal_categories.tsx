import classNames from "classnames";
import { differenceInMilliseconds } from "date-fns";
import { useTranslations } from "next-intl";
import { FC } from "react";

import {
  CategoryKey,
  LeaderboardType,
  Medal,
  MedalCategory,
  MedalEntry,
  MedalProjectType,
  MedalType,
} from "@/types/scoring";

import MedalCard from "./medal_card";
import { RANKING_CATEGORIES } from "../../ranking_categories";

const MEDALS_ORDER: MedalType[] = ["gold", "silver", "bronze"];
const CATEGORY_KEYS_ORDER: CategoryKey[] = [
  "tournament",
  "peer",
  "baseline",
  "questionWriting",
  "comments",
];

type Props = {
  medalEntries: MedalEntry[];
};

const MedalCategories: FC<Props> = ({ medalEntries }) => {
  const t = useTranslations();

  const categories = getMedalCategories(medalEntries);

  return (
    <section className="mb-3 flex flex-col gap-12 pt-4 sm:mb-6">
      {categories.map((category) => (
        <div
          className={classNames(
            "flex flex-col items-center justify-center gap-9 px-3",
            { hidden: category.medals.length === 0 }
          )}
          key={category.name}
        >
          <div className="m-0 flex items-center justify-center gap-4 text-2xl font-bold text-blue-900 dark:text-blue-900-dark sm:text-3xl">
            <span>{t(RANKING_CATEGORIES[category.name].translationKey)}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 self-stretch">
            {category.medals.map((categoryMedal, index) => (
              <MedalCard
                key={`medal-${category.name}-${categoryMedal.type}-${index}`}
                medal={categoryMedal}
                href={"#"}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

function getMedalCategory(
  projectType: MedalProjectType,
  scoreType: LeaderboardType
): CategoryKey | null {
  if (projectType === MedalProjectType.Tournament) {
    return "tournament";
  }

  if (projectType === MedalProjectType.SiteMain) {
    switch (scoreType) {
      case "baseline_global":
        return "baseline";
      case "peer_global":
      case "peer_global_legacy":
        return "peer";
      case "comment_insight":
        return "comments";
      case "question_writing":
        return "questionWriting";
      default:
        return null;
    }
  }

  return null;
}

function getMedalCategories(medalEntries: MedalEntry[]): MedalCategory[] {
  const categoriesDictionary = medalEntries.reduce<
    Record<CategoryKey, Medal[]>
  >(
    (acc, el) => {
      const categoryKey = getMedalCategory(el.project_type, el.score_type);
      if (categoryKey) {
        const medal = getMedalFromEntry(el);
        if (!acc[categoryKey]) {
          acc[categoryKey] = [];
        }
        if (medal) {
          acc[categoryKey].push(medal);
        }
      }

      return acc;
    },
    {} as Record<CategoryKey, Medal[]>
  );

  const categories = Object.entries(categoriesDictionary).reduce<
    MedalCategory[]
  >((acc, [_categoryKey, medals]) => {
    const categoryKey = _categoryKey as CategoryKey;

    const sortedMedals = medals;
    if (categoryKey !== "tournament") {
      sortedMedals.sort((a, b) => b.duration - a.duration);
    }
    sortedMedals.sort(
      (a, b) => MEDALS_ORDER.indexOf(a.type) - MEDALS_ORDER.indexOf(b.type)
    );

    acc.push({
      name: categoryKey,
      medals: sortedMedals,
    });

    return acc;
  }, []);

  return categories.sort(
    (a, b) =>
      CATEGORY_KEYS_ORDER.indexOf(a.name) - CATEGORY_KEYS_ORDER.indexOf(b.name)
  );
}

const getMedalFromEntry = (medalEntry: MedalEntry): Medal | null => {
  if (!medalEntry.rank || !medalEntry.medal) {
    return null;
  }

  return {
    rank: medalEntry.rank,
    type: medalEntry.medal,
    duration: differenceInMilliseconds(
      new Date(medalEntry.end_time),
      new Date(medalEntry.start_time)
    ),
    name: medalEntry.name,
    projectType: medalEntry.project_type,
    projectName: medalEntry.project_name,
    totalEntries: medalEntry.total_entries,
  };
};

export default MedalCategories;
