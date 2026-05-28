import TrophyIcon from "@/components/icons/trophy";
import { Project, TaxonomyProjectType, TournamentType } from "@/types/projects";

export const getChipContent = (element: Project) => {
  if (
    element.type === TournamentType.Tournament ||
    element.type === TaxonomyProjectType.LeaderboardTag
  ) {
    return (
      <span className="flex min-w-0 items-center gap-1">
        <TrophyIcon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">{element.name}</span>
      </span>
    );
  }
  return <span className="min-w-0 truncate">{element.name}</span>;
};

export const getChipColor = (element: Project) =>
  Object.values(TaxonomyProjectType).includes(
    element.type as TaxonomyProjectType
  )
    ? "olive"
    : "orange";
