import { ComponentProps } from "react";

import { JobRow, JobsMonitorSection } from "./jobs-monitor";
import { fetchJobsTableData } from "../helpers/fetch-jobs-data";

export async function JobsMonitorServer(props: ComponentProps<"section">) {
  const { columns, rows } = await fetchJobsTableData();

  const jobs: JobRow[] = rows.map((row) => ({
    name: row[0] as string,
    values: Object.fromEntries(
      columns.map((col, i) => [col, row[i + 1] as number | null])
    ),
  }));

  return <JobsMonitorSection columns={columns} jobs={jobs} {...props} />;
}
