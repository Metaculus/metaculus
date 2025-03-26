"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post?: PostWithForecasts | null;
};

const PostDjangoAdminLink: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { user } = useAuth();

  if (!post || !user?.is_superuser) {
    return null;
  }

  return (
    <Link href={`/admin/posts/post/${post.id}/change`} target="_blank">
      {t("viewInDjangoAdmin")}
    </Link>
  );
};

export default PostDjangoAdminLink;
