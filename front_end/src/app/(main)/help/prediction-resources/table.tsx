import { FC } from "react";

import { DataSource } from "./data_sources";

type Props = {
  data: DataSource[];
};

const DataSourcesTable: FC<Props> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 bg-white text-sm dark:border-gray-700 dark:bg-blue-950">
        <thead>
          <tr className="bg-metac-gray-100 dark:bg-metac-gray-900">
            <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
              Data Service
            </th>
            <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
              Organization
            </th>
            <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
              Topics
            </th>
            <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
              Size
            </th>
            <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
              Ease of Use
            </th>
            <th className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
              Comments
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map(
            ({
              id,
              dataService,
              organization,
              topics,
              size,
              easeOfUse,
              comments,
            }) => (
              <tr key={id}>
                <td className="border-b border-gray-300 px-4 py-2 text-sm dark:border-gray-700">
                  {dataService}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                  {organization}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                  {topics}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                  {size}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                  {easeOfUse}
                </td>
                <td className="border-b border-gray-300 px-4 py-2 dark:border-gray-700">
                  {comments}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataSourcesTable;
