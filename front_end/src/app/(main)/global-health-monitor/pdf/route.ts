import { NextRequest } from "next/server";

import { renderHubPdf } from "@/utils/hub_pdf.server";

import { GHM_ROUTE } from "../config/season";
import { getLatestEdition, resolveEdition } from "../editions";
import { getEditionQuery } from "../helpers/links";

export async function GET(request: NextRequest) {
  const edition = resolveEdition(
    request.nextUrl.searchParams.get("edition") ?? undefined
  );
  const isLatest = edition.slug === getLatestEdition().slug;

  return renderHubPdf({
    request,
    path: `${GHM_ROUTE}${getEditionQuery(isLatest ? null : edition.slug)}`,
    fileName: `global-health-monitor-${edition.slug}.pdf`,
    label: "Global Health Monitor",
  });
}
