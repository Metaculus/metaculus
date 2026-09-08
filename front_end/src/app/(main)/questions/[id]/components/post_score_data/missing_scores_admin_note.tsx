"use client";

import { FC } from "react";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";

import { isPostMissingScores } from "./utils";

type Props = {
  post: PostWithForecasts;
};

const MissingScoresAdminNote: FC<Props> = ({ post }) => {
  const { user } = useAuth();

  if (!user?.is_superuser || !isPostMissingScores(post)) {
    return null;
  }

  return (
    <div className="rounded bg-blue-200 p-3 text-sm text-gray-700 dark:bg-blue-200-dark dark:text-gray-700-dark">
      <span className="text-red-500 dark:text-red-500-dark">
        Not seeing scores?
      </span>{" "}
      This question is resolved so scores should be visible. Scoring can be
      triggered in the{" "}
      <a
        href={`/admin/questions/question/?post__id__exact=${post.id}`}
        className="text-blue-700 underline dark:text-blue-700-dark"
      >
        Admin panel
      </a>{" "}
      by selecting the question and running the &ldquo;Trigger Scoring&rdquo;
      action. (This message is only visible to admins)
    </div>
  );
};

export default MissingScoresAdminNote;
