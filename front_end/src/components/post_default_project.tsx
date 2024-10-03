import Link from "next/link";
import { FC } from "react";

import { Tournament, TournamentType } from "@/types/projects";

type Props = {
  defaultProject: Tournament;
};

const PostDefaultProject: FC<Props> = ({ defaultProject }) => {
  if (
    ![
      TournamentType.Tournament,
      TournamentType.GlobalLeaderboard,
      TournamentType.QuestionSeries,
    ].includes(defaultProject.type) ||
    !defaultProject.default_permission
  ) {
    return null;
  }

  return (
    <Link
      className="inline-flex items-center justify-center gap-1 rounded-l rounded-r border-inherit bg-orange-100 p-1.5 text-sm font-medium leading-4 text-orange-900 no-underline hover:bg-orange-200 dark:bg-orange-100-dark dark:text-orange-900-dark hover:dark:bg-orange-200-dark"
      href={`/tournament/${defaultProject.slug ?? defaultProject.id}`}
    >
      {defaultProject.name}
    </Link>
  );
};

export default PostDefaultProject;
