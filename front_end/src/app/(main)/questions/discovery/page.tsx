import { TAGS_TEXT_SEARCH_FILTER } from "@/app/(main)/questions/discovery/constants/tags_feed";
import ProjectsApi, { TagsParams } from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import CategoriesDiscovery from "./components/categories";
import TagsDiscovery from "./components/tags_discovery";

export default async function ProjectsDiscovery(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const categories = await ProjectsApi.getCategories();
  const filters = getFilters(searchParams);

  return (
    <main className="mx-auto my-10 flex w-full max-w-5xl flex-col items-center justify-center gap-4 p-0 text-gray-800 dark:text-gray-800-dark sm:mb-24">
      <CategoriesDiscovery categories={categories} />
      <TagsDiscovery filters={filters} />
    </main>
  );
}

const getFilters = (searchParams: SearchParams): TagsParams => {
  const filters: TagsParams = {};

  if (typeof searchParams[TAGS_TEXT_SEARCH_FILTER] === "string") {
    filters.search = searchParams[TAGS_TEXT_SEARCH_FILTER];
  }

  return filters;
};
