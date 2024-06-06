import Link from "next/link";
import invariant from "ts-invariant";

import ProjectsApi from "@/services/projects";

export default async function TournamentSlug({
  params,
}: {
  params: { slug: string };
}) {
  const tournament = await ProjectsApi.getSlugTournament(params.slug);
  invariant(tournament, `Tournament not found: ${params.slug}`);

  return (
    <main className="mx-auto mt-4 min-h-min w-full max-w-[780px] flex-auto px-0">
      <div className="dark:metac-blue-600-dark flex flex-wrap items-center gap-2.5 rounded-t bg-metac-blue-600 px-3 py-1.5 text-[20px] uppercase text-metac-gray-100 dark:text-metac-gray-100-dark">
        <Link
          href={"/tournaments"}
          className="no-underline hover:text-metac-gray-400 dark:hover:text-metac-gray-400-dark"
        >
          Tournament
        </Link>
      </div>
      {/*<Image src={} alt="" />*/}
    </main>
  );
}
