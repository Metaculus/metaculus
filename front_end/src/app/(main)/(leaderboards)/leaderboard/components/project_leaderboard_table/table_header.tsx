import classNames from "classnames";
import { FC, PropsWithChildren } from "react";

type Props = {
  className?: string;
};

const TableHeader: FC<PropsWithChildren<Props>> = ({ className, children }) => (
  <th
    className={classNames(
      "border-b border-gray-400 bg-gray-0 px-2 text-sm font-bold dark:border-gray-400-dark dark:bg-gray-0-dark",
      className
    )}
  >
    {children}
  </th>
);

export default TableHeader;
