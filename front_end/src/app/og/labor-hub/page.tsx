import { fetchJobsTableData } from "@/app/(main)/labor-hub/helpers/fetch_jobs_data";
import type { JobRow } from "@/app/(main)/labor-hub/sections/jobs_monitor";
import { JobsMonitorChart } from "@/app/(main)/labor-hub/sections/jobs_monitor";

import { SponsorLogos } from "./sponsor_logos";

export const revalidate = 3600;

const BG = "#242931";

export default async function OgLaborHubPage() {
  const { columns, rows } = await fetchJobsTableData({
    labels: ["2027", "2030", "2035"],
  });
  const year = columns[columns.length - 1] ?? "";

  const jobs: JobRow[] = rows.map((row) => ({
    name: row[0] as string,
    values: Object.fromEntries(
      columns.map((col, i) => [col, row[i + 1] as number | null])
    ),
  }));

  return (
    <div
      id="id-used-by-screenshot-donot-change"
      className="relative h-[630px] w-[1200px] overflow-hidden font-sans"
      style={{ backgroundColor: BG }}
    >
      <div className="absolute inset-y-0 -right-40 flex w-[820px] items-center">
        <div className="w-full px-6 [&_.max-w-3xl]:max-w-none">
          <JobsMonitorChart
            year={year}
            jobs={jobs}
            showInsights={false}
            showFooterNote={false}
          />
        </div>
      </div>

      <div
        className="absolute inset-y-0 left-[420px] w-[420px]"
        style={{
          backgroundImage: `linear-gradient(to right, ${BG} 0%, ${BG} 35%, rgba(36,41,49,0) 100%)`,
        }}
      />

      <div
        id="id-logo-used-by-screenshot-donot-change"
        className="absolute bottom-[4.5rem] left-[4.5rem] top-28 z-10 flex w-[600px] flex-col justify-between"
      >
        <div className="flex flex-col gap-8">
          <h1 className="m-0 text-[72px] font-bold leading-[1.1] tracking-[-0.03em]">
            <span style={{ color: "#d7e7f7" }}>Labor Automation</span>
            <br />
            <span style={{ color: "#718ea8" }}>Forecasting Hub</span>
          </h1>
          <p
            className="m-0 text-balance text-[32px] leading-[1.35]"
            style={{ color: "#bfd4ec" }}
          >
            Real-time forecasts from our global forecasting community on the
            future of the US workforce as AI advances.
          </p>
        </div>

        <SponsorLogos className="gap-10 [&_svg:nth-child(1)]:h-[28px] [&_svg:nth-child(2)]:h-[36px] [&_svg:nth-child(3)]:h-[42px]" />
      </div>
    </div>
  );
}
