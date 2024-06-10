import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FC, Suspense } from "react";

import DiscoverySection from "@/app/(main)/questions/discovery/components/section";
import TagFilters from "@/app/(main)/questions/discovery/components/tag_filters";
import { TAGS_TEXT_SEARCH_FILTER } from "@/app/(main)/questions/discovery/constants/tags_feed";
import Chip from "@/components/ui/chip";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POST_TAGS_FILTER } from "@/constants/posts_feed";
import ProjectsApi, { TagsParams } from "@/services/projects";
import { SearchParams } from "@/types/navigation";

const TagsDiscovery: FC<{ searchParams: SearchParams }> = ({
  searchParams,
}) => {
  const filters = getFilters(searchParams);
  const t = useTranslations();

  return (
    <DiscoverySection title={t("tags")}>
      <TagFilters />
      <Suspense
        key={JSON.stringify(searchParams)}
        fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}
      >
        <AwaitedTags filters={filters} />
      </Suspense>
    </DiscoverySection>
  );
};

type TagsProps = {
  filters: TagsParams;
};

const AwaitedTags: FC<TagsProps> = async ({ filters }) => {
  const tags = await ProjectsApi.getTags(filters);
  const t = await getTranslations();

  if (!tags.length) {
    return (
      <div className="flex items-center justify-center text-sm text-blue-900 dark:text-blue-900-dark">
        {t("noTags")}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-start gap-x-2.5 gap-y-3 self-stretch">
      {tags.map((tag) => (
        <Chip
          key={tag.slug}
          href={`/questions/?${POST_TAGS_FILTER}=${tag.slug}`}
          color="blue"
          size="sm"
          label={tag.questions_count.toString()}
        >
          {tag.name}
        </Chip>
      ))}
    </div>
  );
};

const getFilters = (searchParams: SearchParams) => {
  const filters: TagsParams = {};

  if (typeof searchParams[TAGS_TEXT_SEARCH_FILTER] === "string") {
    filters.search = searchParams[TAGS_TEXT_SEARCH_FILTER];
  }

  return filters;
};

export default TagsDiscovery;
