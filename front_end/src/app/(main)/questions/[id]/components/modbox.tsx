"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";

import { approvePost, draftPost, submitPostForReview } from "../../actions";

export default function Modbox({ post }: { post: PostWithForecasts }) {
  let edit_type = "question";
  if (post.group_of_questions) {
    edit_type = "group";
  } else if (post.conditional) {
    edit_type = "conditional";
  } else if (post.notebook) {
    edit_type = "notebook";
  }

  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="mb-2 mt-2 flex flex-row items-center gap-4">
      {post.status == PostStatus.PENDING && (
        <button
          className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
          onClick={async () => {
            await draftPost(post.id);
            router.refresh();
          }}
        >
          {t("sendBackDraftButton")}
        </button>
      )}
      {post.status == PostStatus.DRAFT && (
        <button
          className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
          onClick={async () => {
            await submitPostForReview(post.id);
            router.refresh();
          }}
        >
          {t("submitForReviewButton")}
        </button>
      )}
      {post.status == PostStatus.PENDING &&
        [ProjectPermissions.CURATOR, ProjectPermissions.ADMIN].includes(
          post.user_permission
        ) && (
          <button
            className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
            onClick={async () => {
              // await approvePost(post.id);
              router.refresh();
            }}
          >
            {t("approveButton")}
          </button>
        )}

      <button className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark">
        <a
          href={`/questions/create/${edit_type}?post_id=${post.id}`}
          className="no-underline"
        >
          {t("editButton")}
        </a>
      </button>
    </div>
  );
}
