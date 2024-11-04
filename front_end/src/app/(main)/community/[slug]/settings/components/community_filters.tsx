"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Button from "@/components/ui/button";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { POST_STATUS_FILTER } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { Community } from "@/types/projects";

type Props = {
  community: Community;
};
const CommunityFilters: FC<Props> = ({ community }) => {
  const t = useTranslations();
  const { params, setParam, deleteParam, navigateToSearchParams } =
    useSearchParams();

  const defaultStatus = PostStatus.OPEN;
  const questionStatuses: GroupButton<PostStatus>[] = [
    { label: t("live"), value: PostStatus.OPEN },
    { label: t("closed"), value: PostStatus.CLOSED },
    { label: t("resolved"), value: PostStatus.RESOLVED },
  ];
  const status = (params.get(POST_STATUS_FILTER) ??
    defaultStatus) as PostStatus;

  const handleStatusChange = (status: PostStatus) => {
    const withNavigation = false;
    if (status === defaultStatus) {
      deleteParam(POST_STATUS_FILTER, withNavigation);
    } else {
      setParam(POST_STATUS_FILTER, status, withNavigation);
    }

    navigateToSearchParams();
  };
  return (
    <div className="mx-0 my-3 flex flex-wrap items-center gap-2">
      <div className="flex flex-1 gap-2">
        <ButtonGroup
          value={status}
          buttons={questionStatuses}
          onChange={handleStatusChange}
          variant="tertiary"
          onClick={(buttonLabel) =>
            sendGAEvent("event", "feedShortcutClick", {
              event_category: buttonLabel,
            })
          }
        />
        <Button
          className={classNames(
            "mr-auto whitespace-nowrap !border-blue-500 capitalize !text-blue-700 dark:!border-blue-500-dark dark:!text-blue-700-dark",
            {
              "!bg-blue-900 !text-white hover:!bg-blue-800 dark:!bg-blue-100 dark:!text-blue-900 dark:hover:!bg-blue-200":
                status === PostStatus.PENDING,
            }
          )}
          onClick={() => handleStatusChange(PostStatus.PENDING)}
        >
          {t("inReview")}
        </Button>
      </div>
      <Button
        className="whitespace-nowrap !border-blue-500 capitalize !text-blue-700 dark:!border-blue-500-dark dark:!text-blue-700-dark"
        href={`/questions/create/?community_id=${community.id}`}
      >
        <FontAwesomeIcon icon={faPlus} width={14} />
        {t("createQuestion")}
      </Button>
    </div>
  );
};

export default CommunityFilters;
