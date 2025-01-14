"use client";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import Chip from "@/components/ui/chip";
import {
  POST_CATEGORIES_FILTER,
  POST_TAGS_FILTER,
} from "@/constants/posts_feed";
import { useModal } from "@/contexts/modal_context";
import { PostWithForecasts } from "@/types/post";

import { removePostFromProject } from "../../../actions";

type Props = {
  postId: number;
  tagData: PostWithForecasts["projects"];
  allowModifications: boolean;
};

const INITIAL_NUM_OF_TAGS = 10;

const SidebarQuestionTags: FC<Props> = ({
  postId,
  tagData,
  allowModifications,
}) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  const {
    category: _category,
    tag: _tag,
    tournament: _tournament,
    question_series: _question_series,
    community: _community,
  } = tagData;
  const tag = _tag ?? [];
  const category = _category ?? [];
  const tournament = _tournament ?? [];
  const question_series = _question_series ?? [];
  const community = _community ?? [];

  const [showAllTags, setShowAllTags] = useState(
    (tag.length ?? 0) < INITIAL_NUM_OF_TAGS
  );

  const tagsToShow = showAllTags ? tag : tag.slice(0, INITIAL_NUM_OF_TAGS);
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-4 self-stretch">
      <div className="flex flex-wrap content-start items-start gap-2.5 self-stretch @lg:m-0">
        {tournament.map((element) => (
          <Chip
            color="orange"
            key={element.id}
            href={`/tournament/${element.slug ?? element.id}/`}
            onClick={() =>
              sendGAEvent("event", "questionTagClicked", {
                event_category: element.name,
              })
            }
          >
            {element.name}
          </Chip>
        ))}

        {question_series.map((element) => (
          <Chip
            color="orange"
            key={element.id}
            href={`/tournament/${element.slug ?? element.id}/`}
            onClick={() =>
              sendGAEvent("event", "questionTagClicked", {
                event_category: element.name,
              })
            }
          >
            {element.name}
          </Chip>
        ))}

        {community.map((element) => (
          <Chip
            color="orange"
            key={element.id}
            href={`/c/${element.slug}`}
            onClick={() =>
              sendGAEvent("event", "questionTagClicked", {
                event_category: element.name,
              })
            }
          >
            {element.name}
          </Chip>
        ))}

        {category.map((element) => (
          <Chip
            color="olive"
            key={element.id}
            href={`/questions/?${POST_CATEGORIES_FILTER}=${element.slug}&for_main_feed=false`}
            onClick={() =>
              sendGAEvent("event", "questionTagClicked", {
                event_category: element.name,
              })
            }
          >
            {element.name}
          </Chip>
        ))}

        {tagsToShow.map((element) => (
          <Chip
            key={element.id}
            href={`/questions/?${POST_TAGS_FILTER}=${element.slug}&for_main_feed=false`}
            color={element.is_global_leaderboard ? "gray" : "blue"}
            xMark={element.is_global_leaderboard ? false : allowModifications}
            onXMarkClick={async () => {
              await removePostFromProject(postId, element.id);
              router.refresh();
            }}
            onClick={() =>
              sendGAEvent("event", "questionTagClicked", {
                event_category: element.name,
              })
            }
          >
            {element.name}
          </Chip>
        ))}
      </div>

      {tagsToShow.length > 0 && !showAllTags && (
        <Button
          size="sm"
          variant="tertiary"
          onClick={() => setShowAllTags(true)}
        >
          {t("showMoreTags")}
        </Button>
      )}

      <Button
        size="sm"
        variant="tertiary"
        onClick={() => setCurrentModal({ type: "contactUs" })}
      >
        <FontAwesomeIcon icon={faCircleQuestion} />
        {t("submitTagsFeedback")}
      </Button>
    </div>
  );
};

export default SidebarQuestionTags;
