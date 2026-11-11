import { NextRequest } from "next/server";

import { renderHubPdf } from "@/utils/hub_pdf.server";

export async function GET(request: NextRequest) {
  return renderHubPdf({
    request,
    path: "/labor-hub/",
    fileName: "labor-automation-hub.pdf",
    label: "Labor Hub",
  });
}
