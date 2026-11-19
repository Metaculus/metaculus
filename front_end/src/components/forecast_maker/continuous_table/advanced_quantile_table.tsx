import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil, uniq } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useMemo, useRef, useState } from "react";

import { FormErrorMessage } from "@/components/ui/form_field";
import NudgeButtons, { nudgeSteps } from "@/components/ui/nudge_buttons";
import {
  DistributionQuantileComponent,
  Quantile,
  QuantileValue,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import cn from "@/utils/core/cn";
import { getQuantileNumericForecastDataset } from "@/utils/forecasts/dataset";
import {
  nudgeBoundProbability,
  nudgeNominalValue,
  nudgePercentile,
} from "@/utils/forecasts/nudge";
import {
  isPercentileRow,
  makeBlankPercentileRow,
  sortQuantileRows,
} from "@/utils/forecasts/quantile_components";
import { percentileFromCdf } from "@/utils/math";

import ContinuousTableInput from "./continuous_table_input";
import {
  QuantileValidationError,
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";

type Props = {
  question: QuestionWithNumericForecasts;
  components: DistributionQuantileComponent;
  onChange: (components: DistributionQuantileComponent) => void;
  disabled?: boolean;
  // Formats an internal (0-1) location for display
  formatValue: (location: number | null | undefined) => string;
  // Comparison columns. The community column is shown when this isn't
  // undefined (null: no community forecast to show yet); the previous
  // forecast column only when there is one.
  communityCdf?: number[] | null;
  userPreviousCdf?: number[];
  userPreviousLabel: string;
  userPreviousClassName?: string;
};

/**
 * Vertical table for the advanced table mode: any number of percentiles,
 * each with an editable percentile and value, plus the out-of-bounds rows.
 * Rows re-sort by percentile whenever a percentile is committed.
 */
const AdvancedQuantileTable: FC<Props> = ({
  question,
  components,
  onChange,
  disabled = false,
  formatValue,
  communityCdf,
  userPreviousCdf,
  userPreviousLabel,
  userPreviousClassName,
}) => {
  const t = useTranslations();
  const discrete = question.type === QuestionType.Discrete;
  const showCommunity = communityCdf !== undefined;
  const showPrevious = !!userPreviousCdf?.length;

  // Stable React keys per row, so re-sorting moves inputs along with their
  // rows (the inputs hold local state while being edited). Keyed by row
  // object; edits carry the key over to the replacement object.
  const rowKeys = useRef(new WeakMap<QuantileValue, string>());
  const nextKey = useRef(0);
  const getRowKey = (row: QuantileValue) => {
    let key = rowKeys.current.get(row);
    if (!key) {
      key = `row-${nextKey.current++}`;
      rowKeys.current.set(row, key);
    }
    return key;
  };
  const replaceRow = (from: QuantileValue, to: QuantileValue) => {
    rowKeys.current.set(to, getRowKey(from));
    return to;
  };

  // Percentiles being typed (by row key), so comparison values follow the
  // input before it's committed (committing re-sorts, so waits for blur)
  const [draftPercentiles, setDraftPercentiles] = useState<
    Record<string, number | null>
  >({});

  // A comparison CDF's value at a row: the out-of-bounds probability for
  // bound rows, otherwise the value at the row's (draft) percentile
  const comparisonValue = (
    cdf: number[] | null | undefined,
    row: QuantileValue
  ) => {
    if (!cdf?.length) return "—";
    if (row.quantile === Quantile.lower) {
      return `${((cdf[0] ?? 0) * 100).toFixed(1)}%`;
    }
    if (row.quantile === Quantile.upper) {
      return `${((1 - (cdf[cdf.length - 1] ?? 1)) * 100).toFixed(1)}%`;
    }
    const key = getRowKey(row);
    const percentile =
      key in draftPercentiles
        ? draftPercentiles[key]
        : isPercentileRow(row)
          ? row.quantile
          : null;
    if (isNil(percentile) || !(percentile > 0 && percentile < 100)) {
      return "—";
    }
    return formatValue(percentileFromCdf(cdf, percentile, discrete));
  };
  const communityCell = (row: QuantileValue) =>
    showCommunity && (
      <td className="text-center text-xs tabular-nums tracking-tight text-olive-800 dark:text-olive-800-dark sm:text-sm">
        {comparisonValue(communityCdf, row)}
      </td>
    );
  const previousCell = (row: QuantileValue) =>
    showPrevious && (
      <td
        className={cn(
          "text-center text-xs tabular-nums tracking-tight text-orange-800 dark:text-orange-800-dark sm:text-sm",
          userPreviousClassName
        )}
      >
        {comparisonValue(userPreviousCdf, row)}
      </td>
    );

  const updateRow = (
    row: QuantileValue,
    patch: Partial<QuantileValue>,
    { resort = false } = {}
  ) => {
    const updated = replaceRow(row, { ...row, ...patch, isDirty: true });
    const next = components.map((r) => (r === row ? updated : r));
    onChange(resort ? sortQuantileRows(next) : next);
  };

  const deleteRow = (row: QuantileValue) => {
    // Mark the remaining rows dirty: the table as a whole has changed
    onChange(
      components
        .filter((r) => r !== row)
        .map((r) => replaceRow(r, { ...r, isDirty: true }))
    );
  };

  const addRow = () => {
    onChange(sortQuantileRows([...components, makeBlankPercentileRow()]));
  };

  const inputErrors = useMemo(
    () => validateAllQuantileInputs({ question, components, t }),
    [question, components, t]
  );
  // Distribution-level problems, once every input is valid
  const distributionErrors = useMemo(() => {
    if (inputErrors.length) return [];
    const dataset = getQuantileNumericForecastDataset(components, question);
    if (dataset.error) return [t(dataset.error)];
    return validateUserQuantileData({
      question,
      components,
      cdf: dataset.cdf,
      t,
      checkInputData: false,
    });
  }, [inputErrors, components, question, t]);
  // Like the regular table, only show problems once something was edited
  const showErrors = components.some((c) => c.isDirty);

  const rowErrors = (index: number, field: QuantileValidationError["field"]) =>
    showErrors
      ? inputErrors.filter(
          (e) => e.index === index && (e.field ?? "value") === field
        )
      : [];

  const valueInputType =
    question.type === QuestionType.Numeric ||
    question.type === QuestionType.Discrete
      ? "number"
      : "date";
  // First column: highlighted like its header, as the regular table
  // highlights its labels
  const labelCellClassName = "rounded bg-blue-400/60 p-1 dark:bg-blue-600/20";

  return (
    <div className="mb-4">
      <table className="w-full table-fixed border-separate border-spacing-1">
        <thead>
          <tr className="text-xs font-bold text-blue-700 dark:text-blue-800-dark">
            <th className={labelCellClassName}>
              {t("advancedTablePercentile")}
            </th>
            {showCommunity && (
              <th className="p-1 capitalize text-olive-800 dark:text-olive-800-dark">
                {t("community")}
              </th>
            )}
            <th className="p-1 text-orange-800 dark:text-orange-800-dark">
              {t("myPrediction")}
            </th>
            {showPrevious && (
              <th
                className={cn(
                  "p-1 text-orange-800 dark:text-orange-800-dark",
                  userPreviousClassName
                )}
              >
                {userPreviousLabel}
              </th>
            )}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {components.map((row, index) => {
            const isLower = row.quantile === Quantile.lower;
            const isUpper = row.quantile === Quantile.upper;
            if (isLower || isUpper) {
              // A closed bound's row is always 0, so there's nothing to edit
              const isOpen = isLower
                ? question.open_lower_bound
                : question.open_upper_bound;
              if (!isOpen) return null;
              return (
                <tr key={getRowKey(row)}>
                  <td
                    className={cn(
                      labelCellClassName,
                      "text-center text-xs font-bold text-blue-700 dark:text-blue-800-dark sm:text-sm"
                    )}
                  >
                    {/* Same labels as the regular table, e.g. "<10.5cm" */}
                    {formatValue(isLower ? 0 : 1)}
                  </td>
                  {communityCell(row)}
                  <td>
                    <ContinuousTableInput
                      type="number"
                      quantileValue={row}
                      error={rowErrors(index, "value")[0]?.message}
                      onQuantileChange={({ value }) =>
                        updateRow(row, { value })
                      }
                      disabled={disabled}
                      showPercentSign
                      nudge={nudgeBoundProbability}
                    />
                  </td>
                  {previousCell(row)}
                  <td />
                </tr>
              );
            }

            return (
              <tr key={getRowKey(row)}>
                <td className={labelCellClassName}>
                  <PercentileInput
                    label={t("advancedTablePercentile")}
                    value={isPercentileRow(row) ? row.quantile : null}
                    isDirty={row.isDirty}
                    hasError={rowErrors(index, "percentile").length > 0}
                    disabled={disabled}
                    onDraftChange={(draft) => {
                      const key = getRowKey(row);
                      setDraftPercentiles(({ [key]: _, ...rest }) =>
                        draft === undefined ? rest : { ...rest, [key]: draft }
                      );
                    }}
                    onCommit={(quantile) =>
                      updateRow(row, { quantile }, { resort: true })
                    }
                  />
                </td>
                {communityCell(row)}
                <td>
                  <ContinuousTableInput
                    type={valueInputType}
                    quantileValue={row}
                    error={rowErrors(index, "value")[0]?.message}
                    onQuantileChange={({ value }) => updateRow(row, { value })}
                    disabled={disabled}
                    nudge={(value, steps) =>
                      nudgeNominalValue(value, steps, question)
                    }
                  />
                </td>
                {previousCell(row)}
                <td className="text-center">
                  {!disabled && (
                    <button
                      type="button"
                      className="size-6 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-600-dark dark:hover:bg-gray-200-dark dark:hover:text-gray-800-dark"
                      aria-label={t("advancedTableRemovePercentile")}
                      title={t("advancedTableRemovePercentile")}
                      onClick={() => deleteRow(row)}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!disabled && (
        <div className="flex justify-center">
          <button
            type="button"
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-blue-700 hover:bg-blue-100 dark:text-blue-700-dark dark:hover:bg-blue-100-dark"
            onClick={addRow}
          >
            <FontAwesomeIcon icon={faPlus} />
            {t("advancedTableAddPercentile")}
          </button>
        </div>
      )}
      {showErrors &&
        uniq([...inputErrors.map((e) => e.message), ...distributionErrors]).map(
          (message) => <FormErrorMessage errors={[message]} key={message} />
        )}
    </div>
  );
};

type PercentileInputProps = {
  label: string;
  value: number | null;
  onCommit: (value: number | null) => void;
  // The percentile being typed (null if empty), or undefined once editing
  // ends
  onDraftChange?: (value: number | null | undefined) => void;
  isDirty?: boolean;
  hasError?: boolean;
  disabled?: boolean;
};

/**
 * Edits a percentile, shown as e.g. "P25". Commits on blur/Enter (not per
 * keystroke), since committing re-sorts the rows. Up/down (buttons or arrow
 * keys) nudge it by one point.
 */
const PercentileInput: FC<PercentileInputProps> = ({
  label,
  value,
  onCommit,
  onDraftChange,
  isDirty,
  hasError,
  disabled,
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const format = (x: number | null) => (isNil(x) ? "" : String(x));

  // Accepts "25" as well as "P25"
  const parse = (text: string) => {
    const trimmed = text.trim().replace(/^p/i, "").trim();
    return trimmed === "" ? null : Number(trimmed);
  };

  const updateDraft = (text: string) => {
    setDraft(text);
    const parsed = parse(text);
    onDraftChange?.(
      parsed === null || Number.isFinite(parsed) ? parsed : undefined
    );
  };

  const commit = () => {
    if (draft === null) return;
    const parsed = parse(draft);
    setDraft(null);
    onDraftChange?.(undefined);
    // Ignore unparseable input (the previous value is shown again)
    if (parsed !== null && !Number.isFinite(parsed)) return;
    if (parsed !== value) onCommit(parsed);
  };

  const nudge = (steps: number) => {
    if (draft !== null) {
      // Editing: nudge the draft, commit later (on blur) like typing
      const current = parse(draft);
      if (current !== null && !Number.isFinite(current)) return;
      const next = nudgePercentile(current, steps);
      if (next !== undefined) updateDraft(String(next));
    } else {
      const next = nudgePercentile(value, steps);
      if (next !== undefined) onCommit(next);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        placeholder="—"
        aria-label={label}
        value={draft ?? (isNil(value) ? "" : `P${format(value)}`)}
        onFocus={() => setDraft(format(value))}
        onChange={(e) => updateDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setDraft(null);
            onDraftChange?.(undefined);
          } else if (
            !disabled &&
            (e.key === "ArrowUp" || e.key === "ArrowDown")
          ) {
            e.preventDefault();
            nudge(nudgeSteps(e.key === "ArrowUp" ? 1 : -1, e.shiftKey));
          }
        }}
        className={cn(
          "h-10 w-full rounded border-2 border-transparent text-center text-xs text-orange-800 placeholder:text-orange-800 focus:border-blue-700 focus:outline-none dark:bg-gray-0-dark dark:text-orange-800-dark dark:placeholder:text-orange-800-dark dark:focus:border-blue-700-dark sm:text-sm",
          // Room for the nudge buttons, on both sides to stay centered
          !disabled && "px-6 hover:border-blue-600",
          isDirty &&
            !disabled &&
            "border-orange-700 bg-orange-100 dark:border-orange-700-dark dark:bg-orange-100-dark",
          hasError &&
            "border-salmon-500 bg-salmon-200 dark:border-salmon-500-dark dark:bg-salmon-200-dark"
        )}
      />
      {!disabled && <NudgeButtons onNudge={nudge} />}
    </div>
  );
};

export default AdvancedQuantileTable;
