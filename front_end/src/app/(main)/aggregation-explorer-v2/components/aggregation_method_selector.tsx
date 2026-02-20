import {
  faEye,
  faEyeSlash,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import LoadingIndicator from "@/components/ui/loading_indicator";

import AggregationLabel from "./aggregation_label";
import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import { V2AggregationOptionId } from "../hooks/aggregation-data";
import { AggregationExtraMethod } from "../types";

type AggregationFormMode =
  | "recency_weighted"
  | "unweighted"
  | "single_aggregation"
  | "metaculus_prediction"
  | "metaculus_pros"
  | "medalists";

type Props = {
  listItems: {
    id: string;
    label: string;
    chips: string[];
    enabled: boolean;
    activeColor?: string;
    isLoading?: boolean;
    isError?: boolean;
    isNoData?: boolean;
  }[];
  onToggleEnabled: (id: string) => void;
  onRemoveSelected: (id: string) => void;
  onHoverOption?: (id: string | null) => void;
  onAddConfigured: (payload: {
    optionId: V2AggregationOptionId;
    joinedBeforeDate?: string;
    userIds?: number[];
    includeBots?: boolean;
  }) => void;
  defaultIncludeBots?: boolean;
};

export default function AggregationMethodSelector({
  listItems,
  onToggleEnabled,
  onRemoveSelected,
  onHoverOption,
  onAddConfigured,
  defaultIncludeBots = false,
}: Props) {
  const [selectedMode, setSelectedMode] =
    useState<AggregationFormMode>("recency_weighted");
  const [includeBots, setIncludeBots] = useState(defaultIncludeBots);
  const [medalistTier, setMedalistTier] = useState<"all" | "silver" | "gold">(
    "all"
  );
  const [cohortFilter, setCohortFilter] = useState<"none" | "joined_before">(
    "none"
  );
  const [joinedBeforeDate, setJoinedBeforeDate] = useState("");
  const [userIdsText, setUserIdsText] = useState("");

  const resolvedOptionId: V2AggregationOptionId = (() => {
    switch (selectedMode) {
      case "recency_weighted":
        return cohortFilter === "joined_before" && joinedBeforeDate.trim()
          ? AggregationExtraMethod.joined_before_date
          : AggregationExtraMethod.recency_weighted;
      case "unweighted":
        return AggregationExtraMethod.unweighted;
      case "single_aggregation":
        return AggregationExtraMethod.single_aggregation;
      case "metaculus_prediction":
        return AggregationExtraMethod.metaculus_prediction;
      case "metaculus_pros":
        return AggregationExtraMethod.metaculus_pros;
      case "medalists":
        if (medalistTier === "gold") {
          return AggregationExtraMethod.gold_medalists;
        }
        if (medalistTier === "silver") {
          return AggregationExtraMethod.silver_medalists;
        }
        return AggregationExtraMethod.medalists;
    }
  })();

  const selectedOption = AGGREGATION_EXPLORER_OPTIONS.find(
    (o) => o.id === resolvedOptionId
  );
  const showBotToggle = !!selectedOption?.supportsBotToggle;
  const showUserIds = !!selectedOption?.supportsUserIds;

  const parsedUserIds = userIdsText
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  const needsJoinedBeforeDate =
    selectedMode === "recency_weighted" && cohortFilter === "joined_before";
  const canAddConfigured = !needsJoinedBeforeDate || !!joinedBeforeDate.trim();

  return (
    <div className="space-y-6">
      {/* Active aggregations card */}
      <div className="">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-700-dark">
          Aggregations
        </h2>
        {listItems.length ? (
          <div className="mt-2 divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-300 dark:divide-gray-600 dark:border-gray-600">
            {listItems.map((item) => (
              <div
                key={item.id}
                className="flex cursor-pointer items-start gap-1.5 bg-white px-2 py-1.5 text-xs transition hover:bg-gray-100 dark:bg-blue-950 dark:text-gray-200 dark:hover:bg-blue-900/40"
                onMouseEnter={() => onHoverOption?.(item.id)}
                onMouseLeave={() => onHoverOption?.(null)}
                onClick={() => onToggleEnabled(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleEnabled(item.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={
                  item.enabled ? "Hide aggregation" : "Show aggregation"
                }
                aria-pressed={item.enabled}
              >
                <span
                  className="inline-flex w-4 shrink-0 items-center justify-center self-start pt-0.5"
                  style={
                    item.enabled &&
                    item.activeColor &&
                    !item.isError &&
                    !item.isNoData
                      ? { color: item.activeColor }
                      : undefined
                  }
                >
                  {item.isLoading ? (
                    <LoadingIndicator className="h-3 w-3" />
                  ) : item.isError || item.isNoData ? (
                    <FontAwesomeIcon
                      icon={faTriangleExclamation}
                      className="text-orange-500 dark:text-orange-400"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={item.enabled ? faEye : faEyeSlash}
                      className={
                        !item.enabled
                          ? "text-gray-400 dark:text-gray-500"
                          : undefined
                      }
                    />
                  )}
                </span>
                <AggregationLabel
                  label={item.label}
                  chips={item.chips}
                  strikethrough={!item.enabled}
                  warning={item.isError || item.isNoData}
                />
                <button
                  type="button"
                  className="shrink-0 self-start px-1 pt-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSelected(item.id);
                  }}
                  aria-label="Remove aggregation"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-600-dark">
            No aggregations selected yet.
          </p>
        )}
      </div>

      {/* Add aggregation card */}
      <div className="">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-700-dark">
          Add aggregation
        </h2>

        <div className="rounded-md border border-gray-300 bg-gray-0 p-3 dark:border-gray-500-dark dark:bg-gray-0-dark">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Aggregation mode
          </label>
          <select
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
            value={selectedMode}
            onChange={(e) =>
              setSelectedMode(e.target.value as AggregationFormMode)
            }
            onFocus={() => onHoverOption?.(resolvedOptionId)}
            onBlur={() => onHoverOption?.(null)}
          >
            <option value="recency_weighted">Recency weighted</option>
            <option value="unweighted">Unweighted</option>
            <option value="metaculus_prediction">Metaculus prediction</option>
            <option value="single_aggregation">Single aggregation</option>
            <option value="metaculus_pros">Metaculus Pros</option>
            <option value="medalists">Medalists</option>
          </select>

          {selectedMode === "recency_weighted" && (
            <>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Cohort filter
              </label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
                value={cohortFilter}
                onChange={(e) =>
                  setCohortFilter(e.target.value as "none" | "joined_before")
                }
              >
                <option value="none">None</option>
                <option value="joined_before">Joined before date</option>
              </select>
            </>
          )}

          {needsJoinedBeforeDate && (
            <>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Joined before date
              </label>
              <input
                type="date"
                value={joinedBeforeDate}
                onChange={(e) => setJoinedBeforeDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
              />
            </>
          )}

          {selectedMode === "medalists" && (
            <>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Medal tier
              </label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
                value={medalistTier}
                onChange={(e) =>
                  setMedalistTier(e.target.value as "all" | "silver" | "gold")
                }
              >
                <option value="all">All medals</option>
                <option value="silver">Silver and gold</option>
                <option value="gold">Gold only</option>
              </select>
            </>
          )}

          {showBotToggle && (
            <>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Bots
              </label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
                value={includeBots ? "include" : "exclude"}
                onChange={(e) => setIncludeBots(e.target.value === "include")}
              >
                <option value="exclude">Exclude bots</option>
                <option value="include">Include bots</option>
              </select>
            </>
          )}

          {showUserIds && (
            <>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                User IDs (comma separated)
              </label>
              <input
                type="text"
                value={userIdsText}
                onChange={(e) => setUserIdsText(e.target.value)}
                placeholder="123, 456, 789"
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
              />
            </>
          )}

          <button
            type="button"
            className="mt-3 w-full rounded-md border border-blue-600 bg-blue-100 px-3 py-2 text-sm font-medium text-blue-900 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-200"
            disabled={!canAddConfigured}
            onClick={() => {
              onAddConfigured({
                optionId: resolvedOptionId,
                joinedBeforeDate: needsJoinedBeforeDate
                  ? joinedBeforeDate
                  : undefined,
                userIds:
                  showUserIds && parsedUserIds.length
                    ? parsedUserIds
                    : undefined,
                includeBots: showBotToggle ? includeBots : undefined,
              });
            }}
          >
            Add aggregation
          </button>
        </div>
      </div>
    </div>
  );
}
