"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Button from "@/components/ui/button";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { POST_STATUS_FILTER } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { Community } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/cn";

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
    { label: t("Upcoming"), value: PostStatus.UPCOMING },
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
    <div className="mx-0 my-3 flex flex-col flex-wrap items-start gap-2 md:flex-row md:items-center">
      <div className="flex flex-1 flex-col gap-2 md:flex-row">
        <ButtonGroup
          value={status}
          buttons={questionStatuses}
          onChange={handleStatusChange}
          variant="tertiary"
          onClick={(buttonLabel) =>
            sendAnalyticsEvent("feedShortcutClick", {
              event_category: buttonLabel,
            })
          }
        />
        <Button
          className={cn(
            "mr-auto whitespace-nowrap border-blue-500 capitalize text-blue-700 dark:border-blue-500-dark dark:text-blue-700-dark",
            {
              "bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200":
                status === PostStatus.PENDING,
            }
          )}
          onClick={() => handleStatusChange(PostStatus.PENDING)}
        >
          {t("inReview")}
        </Button>
      </div>
      <Button
        className="whitespace-nowrap border-blue-500 capitalize text-blue-700 dark:border-blue-500-dark dark:text-blue-700-dark"
        href={`/questions/create/?community_id=${community.id}`}
      >
        <FontAwesomeIcon icon={faPlus} width={14} />
        {t("createQuestion")}
      </Button>
    </div>
  );
};

export default CommunityFilters;
