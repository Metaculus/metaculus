import { getTranslations } from "next-intl/server";
import { FC, Suspense } from "react";

import TagFilters from "@/app/(main)/questions/discovery/components/tag_filters";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import LoadingIndicator from "@/components/ui/loading_indicator";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TagsParams } from "@/services/api/projects/projects.shared";

import DiscoverySection from "./section";
import AwaitedTags from "./tags";

const TagsDiscovery: FC<{ filters: TagsParams }> = async ({ filters }) => {
  const tags = await ServerProjectsApi.getTags(filters);
  const t = await getTranslations();

  return (
    <DiscoverySection title={t("tags")}>
      <TagFilters />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}
      >
        <AwaitedTags tags={tags} />
      </Suspense>
    </DiscoverySection>
  );
};

export default WithServerComponentErrorBoundary(TagsDiscovery);
