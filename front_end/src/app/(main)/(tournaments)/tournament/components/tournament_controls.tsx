"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { toggleAddPostsToMainFeed } from "@/app/(main)/(tournaments)/tournament/[slug]/actions";
import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import { Tournament } from "@/types/projects";

type Props = {
  tournament: Tournament;
};

const TournamentControls: FC<Props> = ({ tournament }) => {
  const t = useTranslations();

  return (
    <>
      <DropdownMenu
        items={[
          {
            id: "toggleMainFeed",
            name: tournament.add_posts_to_main_feed
              ? t("tournamentHidePostsToMainFeed")
              : t("tournamentShowPostsToMainFeed"),
            onClick: () => {
              toggleAddPostsToMainFeed(tournament.id).then();
            },
          },
        ]}
      >
        <Button className="h-8 w-8 text-white" variant="link">
          <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
        </Button>
      </DropdownMenu>
    </>
  );
};

export default TournamentControls;
