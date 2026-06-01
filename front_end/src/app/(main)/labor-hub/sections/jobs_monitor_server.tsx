import { ComponentProps } from "react";

import { JobRow, JobsMonitorSection } from "./jobs_monitor";
import { fetchJobsTableData } from "../helpers/fetch_jobs_data";

export async function JobsMonitorServer({
  labels,
  ...props
}: ComponentProps<"div"> & { labels?: string[] }) {
  const { columns, rows, postIds } = await fetchJobsTableData({ labels });

  const jobs: JobRow[] = rows.map((row) => ({
    name: row[0] as string,
    values: Object.fromEntries(
      columns.map((col, i) => [col, row[i + 1] as number | null])
    ),
  }));

  return (
    <JobsMonitorSection
      columns={columns}
      jobs={jobs}
      postIds={postIds}
      {...props}
    />
  );
}
