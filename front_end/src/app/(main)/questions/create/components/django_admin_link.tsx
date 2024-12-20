"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts | null;
};

const PostDjangoAdminLink: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { user } = useAuth();

  if (!post || !user?.is_superuser) {
    return null;
  }

  return (
    <a href={`/admin/posts/post/${post.id}/change`} target="_blank">
      {t("viewInDjangoAdmin")}
    </a>
  );
};

export default PostDjangoAdminLink;
