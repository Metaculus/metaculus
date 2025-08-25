import Link from "next/link";
import { FC } from "react";

import TruncatedTextTooltip from "@/components/truncated_text_tooltip";
import { Tournament, TournamentType } from "@/types/projects";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  defaultProject: Tournament;
};

const PostDefaultProject: FC<Props> = ({ defaultProject }) => {
  const withDefaultProjectBadge =
    [
      TournamentType.Tournament,
      TournamentType.QuestionSeries,
      TournamentType.Community,
      TournamentType.Index,
    ].includes(defaultProject.type) && !!defaultProject.default_permission;

  if (!withDefaultProjectBadge) {
    return null;
  }

  return (
    <Link
      className="inline-flex items-center justify-center gap-1 rounded-l rounded-r border-inherit bg-orange-200 text-xs font-medium leading-4 text-orange-900 no-underline hover:bg-orange-300 dark:bg-orange-200-dark dark:text-orange-900-dark hover:dark:bg-orange-300-dark"
      href={getProjectLink(defaultProject)}
    >
      <TruncatedTextTooltip
        text={defaultProject.name}
        className="block max-w-64 truncate p-1 leading-none"
      />
    </Link>
  );
};

export default PostDefaultProject;
