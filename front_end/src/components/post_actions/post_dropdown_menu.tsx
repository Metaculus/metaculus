"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveAs } from "file-saver";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

import {
  changePostActivityBoost,
  getPostCSVData,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { Post } from "@/types/post";
import { base64ToBlob } from "@/utils/files";

type Props = {
  post: Post;
};

export const PostDropdownMenu: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { user } = useAuth();

  const changePostActivity = useCallback(
    (score: number) => {
      changePostActivityBoost(post.id, score).then(({ score_total }) => {
        if (score > 0) {
          toast(t("contentBoosted", { score, score_total }));
        } else {
          toast(t("contentBuried", { score, score_total }));
        }
      });
    },
    [post.id, t]
  );

  const createDuplicateLink = (post: Post) => {
    if (post.question) {
      return `/questions/create/question?mode=create&post_id=${post.id}`;
    } else if (post.conditional) {
      return `/questions/create/conditional?mode=create&post_id=${post.id}`;
    } else if (post.group_of_questions) {
      return `/questions/create/group?mode=create&post_id=${post.id}`;
    } else if (post.notebook) {
      return `/questions/create/notebook?mode=create&post_id=${post.id}`;
    }
    return `/questions/create/question?mode=create&post_id=${post.id}`;
  };

  const handleDownloadCSV = async () => {
    try {
      const base64 = await getPostCSVData(post.id);
      const blob = base64ToBlob(base64);
      const filename = `${post.url_title.replaceAll(" ", "_")}.csv`;
      saveAs(blob, filename);
    } catch (error) {
      toast.error(t("downloadCSVError") + error);
    }
  };

  const items = useMemo(
    () => [
      ...(user?.is_superuser
        ? [
            {
              id: "boost",
              name: t("boost"),
              onClick: () => {
                changePostActivity(50);
              },
            },
            {
              id: "bury",
              name: t("bury"),
              onClick: () => {
                changePostActivity(-50);
              },
            },
            {
              id: "duplicate",
              name: t("duplicate"),
              link: createDuplicateLink(post),
            },
          ]
        : []),
      {
        id: "downloadCSV",
        name: t("downloadCSV"),
        onClick: handleDownloadCSV,
      },
    ],
    [changePostActivity, t, user?.is_superuser]
  );

  if (items.length) {
    return (
      <DropdownMenu items={items}>
        <Button
          variant="secondary"
          className="!rounded border-0"
          presentationType="icon"
        >
          <FontAwesomeIcon icon={faEllipsis} className="text-lg" />
        </Button>
      </DropdownMenu>
    );
  }
};
