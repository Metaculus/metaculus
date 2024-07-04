"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  getMainOrderOptions,
  getPostsFilters,
} from "@/app/(main)/questions/helpers/filters";
import PostsFilters from "@/components/posts_filters";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { Category, Tag } from "@/types/projects";

type Props = {
  categories: Category[];
  tags: Tag[];
};

const TournamentFilters: FC<Props> = ({ categories, tags }) => {
  const { user } = useAuth();
  const { params } = useSearchParams();
  const t = useTranslations();

  const filters = useMemo(() => {
    return getPostsFilters({ tags, user, t, params, categories });
  }, [categories, params, t, tags, user]);

  const mainSortOptions = useMemo(() => {
    return getMainOrderOptions(t);
  }, [t]);

  return <PostsFilters filters={filters} mainSortOptions={mainSortOptions} />;
};

export default TournamentFilters;
