import ServerProjectsApi from "@/services/api/projects/projects.server";

import CategoriesDiscovery from "./components/categories";

export default async function ProjectsDiscovery() {
  const categories = await ServerProjectsApi.getCategories();

  return (
    <main className="mx-auto my-10 flex w-full max-w-5xl flex-col items-center justify-center gap-4 p-0 text-gray-800 dark:text-gray-800-dark sm:mb-24">
      <CategoriesDiscovery categories={categories} />
    </main>
  );
}
