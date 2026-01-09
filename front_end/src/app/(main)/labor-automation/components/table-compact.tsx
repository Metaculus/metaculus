import { DetailedHTMLProps, FC, HTMLProps, ReactNode } from "react";

import cn from "@/utils/core/cn";

type TableCompactProps = {
  title?: string;
  HeadingSection?: ReactNode;
} & DetailedHTMLProps<HTMLProps<HTMLTableElement>, HTMLTableElement>;

/**
 * A compact table component with smaller padding and text.
 * Apply the "inverted" class to use darker bg in light mode and lighter bg in dark mode.
 * Based on Figma design: 20px padding, 12px header text, 14px body text.
 */
export const TableCompact: FC<TableCompactProps> = ({
  className,
  title,
  HeadingSection = null,
  children,
  ...props
}) => (
  <div
    className={cn(
      "overflow-hidden rounded bg-blue-200 p-5 dark:bg-blue-800",
      className
    )}
  >
    {HeadingSection}
    <table className="w-full" {...props}>
      {children}
    </table>
  </div>
);

export const TableCompactHead: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableSectionElement>, HTMLTableSectionElement>
> = ({ className, ...props }) => <thead className={cn(className)} {...props} />;

export const TableCompactBody: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableSectionElement>, HTMLTableSectionElement>
> = ({ className, ...props }) => <tbody className={cn(className)} {...props} />;

export const TableCompactRow: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableRowElement>, HTMLTableRowElement>
> = ({ className, ...props }) => <tr className={cn(className)} {...props} />;

export const TableCompactHeaderCell: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableCellElement>, HTMLTableCellElement>
> = ({ className, ...props }) => (
  <th
    className={cn(
      // 12px text, normal weight, muted color for headers
      "pb-4 text-left text-xs font-normal leading-4 text-blue-700 dark:text-blue-400",
      className
    )}
    {...props}
  />
);

export const TableCompactCell: FC<
  DetailedHTMLProps<HTMLProps<HTMLTableCellElement>, HTMLTableCellElement>
> = ({ className, ...props }) => (
  <td
    className={cn(
      // 14px text, compact vertical padding
      "py-2 text-left text-sm leading-5 text-blue-800 dark:text-blue-100",
      className
    )}
    {...props}
  />
);

// Helper component for displaying wage values with styled "/hr" suffix
export const WageValue: FC<{ value: number; className?: string }> = ({
  value,
  className,
}) => (
  <span className={className}>
    <span>${value}</span>
    <span className="text-gray-500 dark:text-gray-600">/hr</span>
  </span>
);

// Helper component for displaying percentage changes with positive/negative styling
export const PercentageChange: FC<{
  value: number;
  className?: string;
}> = ({ value, className }) => {
  const isPositive = value >= 0;

  return (
    <span
      className={cn(
        isPositive
          ? "text-mint-800 dark:text-mint-300" // Green for positive
          : "text-salmon-700 dark:text-salmon-400", // Red for negative
        className
      )}
    >
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
};
