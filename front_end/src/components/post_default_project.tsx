import { sendGAEvent } from "@next/third-parties/google";
import Link from "next/link";
import { FC } from "react";

import Chip from "@/components/ui/chip";
import { POST_TAGS_FILTER } from "@/constants/posts_feed";
import { Tag } from "@/types/post";
import { Tournament, TournamentType } from "@/types/projects";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  defaultProject: Tournament;
  globalLeaderboard?: Tag;
};

const PostDefaultProject: FC<Props> = ({
  defaultProject,
  globalLeaderboard,
}) => {
  const withDefaultProjectBadge =
    [TournamentType.Tournament, TournamentType.QuestionSeries].includes(
      defaultProject.type
    ) && !!defaultProject.default_permission;

  if (!withDefaultProjectBadge) {
    if (!!globalLeaderboard) {
      return (
        <Chip
          key={globalLeaderboard.id}
          href={`/questions/?${POST_TAGS_FILTER}=${globalLeaderboard.slug}&for_main_feed=false`}
          color="gray"
          onClick={() =>
            sendGAEvent("event", "questionTagClicked", {
              event_category: globalLeaderboard.name,
            })
          }
        >
          {globalLeaderboard.name}
        </Chip>
      );
    }

    return null;
  }

  return (
    <Link
      className="inline-flex items-center justify-center gap-1 rounded-l rounded-r border-inherit bg-orange-100 p-1.5 text-sm font-medium leading-4 text-orange-900 no-underline hover:bg-orange-200 dark:bg-orange-100-dark dark:text-orange-900-dark hover:dark:bg-orange-200-dark"
      href={getProjectLink(defaultProject)}
    >
      {defaultProject.name}
    </Link>
  );
};

export default PostDefaultProject;
