type Props = {
  label: string;
  chips: string[];
  color?: string;
  strikethrough?: boolean;
  warning?: boolean;
};

export default function AggregationLabel({
  label,
  chips,
  color,
  strikethrough,
  warning,
}: Props) {
  const labelClassName = warning
    ? "block truncate font-semibold text-orange-500 dark:text-orange-400"
    : strikethrough
      ? "block truncate font-semibold text-gray-500 line-through dark:text-gray-500-dark"
      : "block truncate font-semibold";

  return (
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5">
        {color && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <span className={labelClassName}>{label}</span>
      </span>
      {chips.length > 0 && (
        <span className={`mt-0.5 flex flex-wrap gap-1 ${color ? "pl-4" : ""}`}>
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-block rounded bg-gray-100 px-1 py-0.5 text-[10px] leading-none text-gray-600 dark:bg-blue-900/50 dark:text-gray-400"
            >
              {chip}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
