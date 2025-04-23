import { DetailedHTMLProps, FC, HTMLProps, ReactNode } from "react";

import cn from "@/utils/core/cn";

type TableProps = {
  title?: string;
  HeadingSection?: ReactNode;
} & DetailedHTMLProps<HTMLProps<HTMLTableElement>, HTMLTableElement>;

export const Table: FC<TableProps> = ({
  className,
  title,
  HeadingSection = null,
  children,
  ...props
}) => (
  <div
    className={cn(
      "overflow-hidden rounded border border-gray-300 bg-gray-0 text-gray-800 @container dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-800-dark",
      className
    )}
  >
    {HeadingSection}
    <table className="table w-full table-fixed" {...props}>
      {children}
    </table>
  </div>
);

export const TableHead: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableSectionElement>, HTMLTableSectionElement>
> = ({ className, ...props }) => (
  <thead
    className={cn("bg-blue-100 dark:bg-blue-100-dark", className)}
    {...props}
  />
);

export const TableBody: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableSectionElement>, HTMLTableSectionElement>
> = ({ className, ...props }) => <tbody className={cn(className)} {...props} />;

export const TableRow: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableRowElement>, HTMLTableRowElement>
> = ({ className, ...props }) => (
  <tr
    className={cn(
      "border-b border-gray-300 hover:bg-blue-200 dark:border-gray-300-dark dark:hover:bg-blue-200-dark",
      className
    )}
    {...props}
  />
);

export const TableHeaderCell: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableCellElement>, HTMLTableCellElement>
> = ({ className, ...props }) => (
  <th
    className={cn(
      "px-4 py-2.5 text-left text-sm font-bold leading-4 text-gray-500 dark:text-gray-500-dark",
      className
    )}
    {...props}
  />
);

export const TableCell: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableCellElement>, HTMLTableCellElement>
> = ({ className, ...props }) => (
  <td
    className={cn(
      "px-4 py-2.5 text-left text-gray-800 dark:text-gray-800-dark",
      className
    )}
    {...props}
  />
);
