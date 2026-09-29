import { NextRequest } from "next/server";

import { renderHubPdf } from "@/utils/hub_pdf.server";

import { GHM_ROUTE } from "../config/season";
import { getLatestEdition, resolveEdition } from "../editions";
import { getGhmQuery, parseGhmMode } from "../helpers/mode";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const edition = resolveEdition(searchParams.get("edition") ?? undefined);
  const isLatest = edition.slug === getLatestEdition().slug;
  const mode = parseGhmMode(searchParams.get("mode"));

  return renderHubPdf({
    request,
    path: `${GHM_ROUTE}${getGhmQuery({
      edition: isLatest ? null : edition.slug,
      mode,
    })}`,
    fileName: `global-health-monitor-${edition.slug}.pdf`,
    label: "Global Health Monitor",
  });
}
