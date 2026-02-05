import type { StaticImageData } from "next/image";
import Image from "next/image";

import tournamentPlaceholder from "@/app/assets/images/tournament.png";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import type { Tournament } from "@/types/projects";
import { stripHtmlTags } from "@/utils/formatters/string";

export const dynamic = "force-dynamic";

export default async function OgTournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const t: Tournament | null = await ServerProjectsApi.getTournament(slug);

  const headerFromApi = (t?.header_image || "").trim();
  const headerSrc: string | StaticImageData =
    headerFromApi.length > 0 ? headerFromApi : tournamentPlaceholder;
  const headerSrcStr =
    typeof headerSrc === "string"
      ? headerSrc
      : (headerSrc as StaticImageData).src;

  const title = t?.name ?? "Metaculus";
  const desc = stripFirstLine(t?.subtitle || t?.description).slice(0, 180);
  const count = getQuestionCount(t);

  return (
    <div
      id="id-used-by-screenshot-donot-change"
      className="relative h-[630px] w-[1240px] bg-blue-900 font-sans dark:bg-blue-900-dark"
    >
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={headerSrcStr}
          alt=""
          fill
          priority
          unoptimized
          sizes="1240px"
          className="pointer-events-none absolute -left-[0.5%] -top-[0.5%] ml-1.5 block h-[101%] w-[101%] select-none object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/40 to-blue-900/80" />

        <div className="absolute inset-0 p-12">
          <div className="flex h-full items-end">
            <div className="w-full">
              <div
                id="id-logo-used-by-screenshot-donot-change"
                className="mb-3 flex items-center gap-3 text-gray-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-800 text-gray-0">
                  <span className="text-[20px] leading-none">M</span>
                </div>
                <span className="text-[28px] font-semibold leading-none">
                  Metaculus
                </span>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
                <h1
                  className="col-span-2 m-0 line-clamp-2 text-[64px] font-extrabold leading-[1.05] text-gray-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                  title={title}
                >
                  {title}
                </h1>

                {desc ? (
                  <p
                    className="m-0 min-w-0 truncate text-[28px] font-medium text-gray-0/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
                    title={desc}
                  >
                    {desc}
                  </p>
                ) : (
                  <div className="m-0 min-w-0" />
                )}

                {count > 0 && (
                  <div className="shrink-0 justify-self-end rounded-xl bg-blue-900/60 px-4 py-2 text-[26px] font-bold text-gray-0 shadow-md backdrop-blur-sm">
                    {count} {count === 1 ? "Question" : "Questions"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const stripFirstLine = (html?: string): string =>
  stripHtmlTags(html ?? "")
    .split("\n")[0]
    ?.trim() ?? "";

const getQuestionCount = (t: Tournament | null): number =>
  t?.questions_count ?? 0;
