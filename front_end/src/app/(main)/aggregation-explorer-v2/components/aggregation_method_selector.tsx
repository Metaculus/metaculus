import {
  faEye,
  faEyeSlash,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import Switch from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth_context";

import AggregationLabel from "./aggregation_label";
import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import { V2AggregationOptionId } from "../hooks/aggregation-data";
import { AggregationExtraMethod } from "../types";

type AggregationFormMode =
  | "recency_weighted"
  | "cohort"
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
  const { user } = useAuth();
  const isStaff = !!user?.is_staff;

  const [selectedMode, setSelectedMode] =
    useState<AggregationFormMode>("recency_weighted");
  const [includeBots, setIncludeBots] = useState(defaultIncludeBots);
  const [medalistTier, setMedalistTier] = useState<"all" | "silver" | "gold">(
    "all"
  );
  const [joinedBeforeDate, setJoinedBeforeDate] = useState("");
  const [userFilterEnabled, setUserFilterEnabled] = useState(false);
  const [userIdsText, setUserIdsText] = useState("");

  const resolvedOptionId: V2AggregationOptionId = (() => {
    switch (selectedMode) {
      case "recency_weighted":
        return AggregationExtraMethod.recency_weighted;
      case "cohort":
        return AggregationExtraMethod.joined_before_date;
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

  const needsJoinedBeforeDate = selectedMode === "cohort";
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
          <select
            className="mt-1 w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-gray-0 bg-[length:16px] bg-[right_8px_center] bg-no-repeat px-3 py-2 pr-8 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-0-dark dark:text-gray-200 dark:hover:border-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E")`,
            }}
            value={selectedMode}
            onChange={(e) =>
              setSelectedMode(e.target.value as AggregationFormMode)
            }
          >
            <option value="recency_weighted">Recency weighted</option>
            <option value="cohort">Cohort (joined before date)</option>
            <option value="unweighted">Unweighted</option>
            <option value="metaculus_prediction">Metaculus prediction</option>
            {isStaff && (
              <option value="single_aggregation">Single aggregation</option>
            )}
            <option value="metaculus_pros">Metaculus Pros</option>
            <option value="medalists">Medalists</option>
          </select>

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
                className="mt-1 w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-gray-0 bg-[length:16px] bg-[right_8px_center] bg-no-repeat px-3 py-2 pr-8 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-0-dark dark:text-gray-200 dark:hover:border-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E")`,
                }}
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
            <div className="mt-3 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Include bots
              </label>
              <Switch checked={includeBots} onChange={setIncludeBots} />
            </div>
          )}

          {showUserIds && isStaff && (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Filter by users
                </label>
                <Switch
                  checked={userFilterEnabled}
                  onChange={setUserFilterEnabled}
                />
              </div>
              {userFilterEnabled && (
                <input
                  type="text"
                  value={userIdsText}
                  onChange={(e) => setUserIdsText(e.target.value)}
                  placeholder="User IDs (comma separated)"
                  className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
                />
              )}
            </div>
          )}

          <Button
            className="mt-3 w-full"
            disabled={!canAddConfigured}
            onClick={() => {
              onAddConfigured({
                optionId: resolvedOptionId,
                joinedBeforeDate: needsJoinedBeforeDate
                  ? joinedBeforeDate
                  : undefined,
                userIds:
                  showUserIds &&
                  isStaff &&
                  userFilterEnabled &&
                  parsedUserIds.length
                    ? parsedUserIds
                    : undefined,
                includeBots: showBotToggle ? includeBots : undefined,
              });
            }}
          >
            Add aggregation
          </Button>
        </div>
      </div>
    </div>
  );
}
