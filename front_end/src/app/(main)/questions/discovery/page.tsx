import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import CategoriesDiscovery from "./components/categories";
import TagsDiscovery from "./components/tags";

export default async function ProjectsDiscovery({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const categories = await ProjectsApi.getCategories();

  return (
    <main className="mx-auto my-10 flex w-full max-w-5xl flex-col items-center justify-center gap-4 p-0 text-gray-800 dark:text-gray-800-dark sm:mb-24">
      <CategoriesDiscovery categories={categories} />
      <TagsDiscovery searchParams={searchParams} />
    </main>
  );
}
