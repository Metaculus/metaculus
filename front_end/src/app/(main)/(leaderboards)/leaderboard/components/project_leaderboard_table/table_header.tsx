import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = {
  className?: string;
};

const TableHeader: FC<PropsWithChildren<Props>> = ({ className, children }) => (
  <th
    className={cn(
      "border-b border-gray-400 bg-gray-0 px-4 py-2.5 text-sm font-bold dark:border-gray-400-dark dark:bg-gray-0-dark",
      className
    )}
  >
    {children}
  </th>
);

export default TableHeader;
