"use client";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

  const { category: _category, tag: _tag } = tagData;
  const tag = _tag ?? [];
  const category = _category ?? [];

  const [showAllTags, setShowAllTags] = useState(
    (tag.length ?? 0) < INITIAL_NUM_OF_TAGS
  );

  const tagsToShow = showAllTags ? tag : tag.slice(0, INITIAL_NUM_OF_TAGS);
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-4 self-stretch border-t border-gray-300 @lg:border-0 dark:border-gray-300-dark">
      <div className="mt-4 flex flex-wrap content-start items-start gap-2.5 self-stretch @lg:m-0">
        {category.map((element) => (
          <Chip
            color="olive"
            key={element.id}
            href={`/questions/?${POST_CATEGORIES_FILTER}=${element.slug}`}
          >
            {element.name}
          </Chip>
        ))}

        {tagsToShow.map((element) => (
          <Chip
            key={element.id}
            href={`/questions/?${POST_TAGS_FILTER}=${element.slug}`}
            color="blue"
            xMark={allowModifications}
            onXMarkClick={async () => {
              await removePostFromProject(postId, element.id);
              router.refresh();
            }}
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
