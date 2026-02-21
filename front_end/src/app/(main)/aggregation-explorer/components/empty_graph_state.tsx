type Variant = "empty" | "loading" | "error";

const VARIANT_STYLES: Record<Variant, { border: string; text: string }> = {
  empty: {
    border: "border-dashed border-gray-300 dark:border-gray-500-dark",
    text: "text-gray-600 dark:text-gray-600-dark",
  },
  loading: {
    border: "border-gray-300 dark:border-gray-500-dark",
    text: "text-gray-700 dark:text-gray-700-dark",
  },
  error: {
    border: "border-red-300 dark:border-red-500/40",
    text: "text-red-600 dark:text-red-400",
  },
};

type Props = {
  variant: Variant;
  message: string;
};

export default function EmptyGraphState({ variant, message }: Props) {
  const { border, text } = VARIANT_STYLES[variant];

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-700-dark">
        Timeline
      </h2>
      <div className={`mt-1 rounded-xl border p-8 text-sm ${border} ${text}`}>
        {message}
      </div>
    </div>
  );
}
