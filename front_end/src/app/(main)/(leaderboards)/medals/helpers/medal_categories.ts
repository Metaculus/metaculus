import { differenceInYears } from "date-fns";
import { number } from "zod";

import {
  CategoryKey,
  LeaderboardType,
  Medal,
  MedalCategory,
  MedalEntry,
  MedalProjectType,
  MedalType,
} from "@/types/scoring";

const MEDALS_ORDER: MedalType[] = ["gold", "silver", "bronze"];
const CATEGORY_KEYS_ORDER: CategoryKey[] = [
  "tournament",
  "peer",
  "baseline",
  "questionWriting",
  "comments",
];

export function getMedalCategories(
  medalEntries: MedalEntry[],
  withEmptyCategories = false
): MedalCategory[] {
  const initialCategories = (withEmptyCategories
    ? {
        tournament: [],
        peer: [],
        baseline: [],
        comments: [],
        questionWriting: [],
      }
    : {}) as unknown as Record<CategoryKey, Medal[]>;
  const categoriesDictionary = medalEntries.reduce<
    Record<CategoryKey, Medal[]>
  >((acc, el) => {
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
  }, initialCategories);

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

const getMedalFromEntry = (medalEntry: MedalEntry): Medal | null => {
  if (!medalEntry.rank || !medalEntry.medal) {
    return null;
  }

  return {
    rank: medalEntry.rank,
    type: medalEntry.medal,
    // year: new Date(medalEntry.start_time).getFullYear(),
    year: Number(medalEntry.start_time.split("-")[0]),
    duration: differenceInYears(
      new Date(medalEntry.end_time),
      new Date(medalEntry.start_time)
    ),
    name: medalEntry.name,
    projectType: medalEntry.project_type,
    projectName: medalEntry.project_name,
    projectSlug: medalEntry.project_slug,
    projectId: medalEntry.project_id,
    totalEntries: medalEntry.total_entries,
  };
};
