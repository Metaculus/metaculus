"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { use } from "ast-types";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo } from "react";

import { changePostActivityBoost } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { Post } from "@/types/post";

type Props = {
  post: Post;
};

const PostDropdownMenu: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { user } = useAuth();

  const changePostActivity = useCallback(
    (score: number) => {
      changePostActivityBoost(post.id, score).then(({ score_total }) => {
        if (score > 0) {
          alert(t("contentBoosted", { score, score_total }));
        } else {
          alert(t("contentBuried", { score, score_total }));
        }
      });
    },
    [post.id, t]
  );
  const items = useMemo(
    () => [
      ...(user?.is_superuser
        ? [
            {
              id: "boost",
              name: t("boost"),
              onClick: () => {
                changePostActivity(20);
              },
            },
            {
              id: "bury",
              name: t("bury"),
              onClick: () => {
                changePostActivity(-20);
              },
            },
          ]
        : []),
    ],
    [changePostActivity, t, user?.is_superuser]
  );

  if (items.length) {
    return (
      <div className="flex gap-1">
        <DropdownMenu items={items}>
          <Button
            variant="secondary"
            className="!rounded border-0"
            presentationType="icon"
          >
            <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
          </Button>
        </DropdownMenu>
      </div>
    );
  }
};

export default PostDropdownMenu;
