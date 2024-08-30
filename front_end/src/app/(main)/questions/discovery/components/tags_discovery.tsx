import { getTranslations } from "next-intl/server";
import { FC, Suspense } from "react";

import TagFilters from "@/app/(main)/questions/discovery/components/tag_filters";
import LoadingIndicator from "@/components/ui/loading_indicator";
import ProjectsApi, { TagsParams } from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import DiscoverySection from "./section";
import AwaitedTags from "./tags";
import { TAGS_TEXT_SEARCH_FILTER } from "../constants/tags_feed";
import ServerComponentErrorBoundary from "@/components/server_component_error_boundary";

const getFilters = (searchParams: SearchParams) => {
  const filters: TagsParams = {};

  if (typeof searchParams[TAGS_TEXT_SEARCH_FILTER] === "string") {
    filters.search = searchParams[TAGS_TEXT_SEARCH_FILTER];
  }

  return filters;
};

const TagsDiscovery: FC<{ searchParams: SearchParams }> = async ({
  searchParams,
}) => {
  return ServerComponentErrorBoundary(async () => {
    const filters = getFilters(searchParams);
    let tags = await ProjectsApi.getTags(filters);
    const t = await getTranslations();

    return (
      <DiscoverySection title={t("tags")}>
        <TagFilters />
        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}
        >
          <AwaitedTags tags={tags} />
        </Suspense>
      </DiscoverySection>
    );
  });
};

export default TagsDiscovery;
