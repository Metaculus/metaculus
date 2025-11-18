import { useTranslations } from "next-intl";

type Props = {
  value: number;
  year: number;
  unit: string;
  extrapolation?: "" | "linear" | "exponential" | "other";
  basedOn?: string | null;
  source?: string | null;
  isCompact?: boolean;
};

const KeyFactorBaseRateTrend: React.FC<Props> = ({
  value,
  year,
  unit,
  extrapolation = "",
  basedOn,
  source,
  isCompact,
}) => {
  const t = useTranslations();

  const exKey =
    extrapolation === "linear"
      ? "linearExtrapolation"
      : extrapolation === "exponential"
        ? "exponentialExtrapolation"
        : extrapolation === "other"
          ? "genericExtrapolation"
          : null;

  const exLabel = exKey ? t(exKey) : "";

  const number = Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(value);

  return (
    <div className="antialiased">
      <p className="my-0 mb-1 text-[10px] uppercase leading-[12px] text-gray-500 dark:text-gray-500-dark">
        {t("projection")}
      </p>

      <p className="my-0 text-lg font-medium text-gray-500 dark:text-gray-500-dark">
        <span className="text-purple-800 dark:text-purple-800-dark">
          {number} {unit}
        </span>
        <span className="font-normal lowercase"> {t("by")}</span>
        <span> {year}</span>
      </p>

      {!isCompact && (exLabel || basedOn || source) && (
        <p className="my-0 mt-1 text-xs text-gray-500 dark:text-gray-500-dark">
          {exLabel && <span>{exLabel} </span>}

          {basedOn && (
            <span className="text-gray-700 dark:text-gray-700-dark">
              {t.rich("basedOnDataRich", {
                value: basedOn,
                strong: (chunks) => chunks,
              })}
            </span>
          )}

          {basedOn && " "}

          {source && (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="lowercase text-blue-600 underline dark:text-blue-600-dark"
            >
              ({t("source")})
            </a>
          )}
        </p>
      )}
    </div>
  );
};

export default KeyFactorBaseRateTrend;
