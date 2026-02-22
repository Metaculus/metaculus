import {
  faEye,
  faEyeSlash,
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { ComponentProps, useState } from "react";

import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import Switch from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth_context";

import AggregationLabel from "./aggregation_label";
import {
  AGGREGATION_EXPLORER_OPTIONS,
  AGGREGATION_OPTION_BY_ID,
} from "../constants";
import { AggregationMethod } from "../types";

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E")`;
const SELECT_CLASS_NAME =
  "mt-1 w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-gray-0 bg-[length:16px] bg-[right_8px_center] bg-no-repeat px-3 py-2 pr-8 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-0-dark dark:text-gray-200 dark:hover:border-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400";
const SELECT_STYLE = { backgroundImage: CHEVRON_SVG } as const;

function StyledSelect(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={`${SELECT_CLASS_NAME} ${props.className ?? ""}`}
      style={{ ...SELECT_STYLE, ...props.style }}
    />
  );
}

const TOP_LEVEL_OPTIONS = AGGREGATION_EXPLORER_OPTIONS;

export type AggregationListItem = {
  id: string;
  label: string;
  chips: string[];
  enabled: boolean;
  activeColor?: string;
  isLoading?: boolean;
  isError?: boolean;
  isNoData?: boolean;
};

type Props = {
  listItems: AggregationListItem[];
  onToggleEnabled: (id: string) => void;
  onRemoveSelected: (id: string) => void;
  onHoverOption?: (id: string | null) => void;
  onAddConfigured: (payload: {
    optionId: AggregationMethod;
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
  const t = useTranslations();
  const tLabel = (key: string) => t(key as Parameters<typeof t>[0]);
  const { user } = useAuth();
  const isStaff = !!user?.is_staff;

  const [selectedTopLevelId, setSelectedTopLevelId] = useState<string>(
    AggregationMethod.recency_weighted
  );
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [includeBots, setIncludeBots] = useState(defaultIncludeBots);
  const [joinedBeforeDate, setJoinedBeforeDate] = useState("");
  const [userFilterEnabled, setUserFilterEnabled] = useState(false);
  const [userIdsText, setUserIdsText] = useState("");

  const visibleTopLevelOptions = TOP_LEVEL_OPTIONS.filter(
    (o) => !o.isStaffOnly || isStaff
  );
  const topLevelOption = AGGREGATION_OPTION_BY_ID.get(selectedTopLevelId);
  const children = topLevelOption?.childSelector;
  const resolvedOptionId =
    selectedChildId ?? children?.options[0]?.id ?? selectedTopLevelId;
  const selectedOption = AGGREGATION_OPTION_BY_ID.get(resolvedOptionId);

  const showBotToggle = !!selectedOption?.supportsBotToggle;
  const showUserIds = !!selectedOption?.supportsUserIds;
  const needsDate = !!topLevelOption?.requiresDate;
  const canAdd = !needsDate || !!joinedBeforeDate.trim();

  const parsedUserIds = userIdsText
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  return (
    <div className="space-y-6">
      <ActiveAggregationsList
        listItems={listItems}
        onToggleEnabled={onToggleEnabled}
        onRemoveSelected={onRemoveSelected}
        onHoverOption={onHoverOption}
      />

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-700-dark">
          {t("addAggregation")}
        </h2>

        <div className="rounded-md border border-gray-300 bg-gray-0 p-3 dark:border-gray-500-dark dark:bg-gray-0-dark">
          <StyledSelect
            value={selectedTopLevelId}
            onChange={(e) => {
              setSelectedTopLevelId(e.target.value);
              setSelectedChildId(null);
            }}
          >
            {visibleTopLevelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {tLabel(option.labelKey)}
              </option>
            ))}
          </StyledSelect>

          {needsDate ? (
            <>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                {t("joinedBeforeDate")}
              </label>
              <input
                type="date"
                value={joinedBeforeDate}
                onChange={(e) => setJoinedBeforeDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
              />
            </>
          ) : null}

          {children ? (
            <>
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                {tLabel(children.labelKey)}
              </label>
              <StyledSelect
                value={resolvedOptionId}
                onChange={(e) => setSelectedChildId(e.target.value)}
              >
                {children.options.map((child) => (
                  <option key={child.id} value={child.id}>
                    {tLabel(child.labelKey)}
                  </option>
                ))}
              </StyledSelect>
            </>
          ) : null}

          {showBotToggle ? (
            <div className="mt-3 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                {t("includeBots")}
              </label>
              <Switch checked={includeBots} onChange={setIncludeBots} />
            </div>
          ) : null}

          {showUserIds && isStaff ? (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  {t("filterByUsers")}
                </label>
                <Switch
                  checked={userFilterEnabled}
                  onChange={setUserFilterEnabled}
                />
              </div>
              {userFilterEnabled ? (
                <input
                  type="text"
                  value={userIdsText}
                  onChange={(e) => setUserIdsText(e.target.value)}
                  placeholder={t("userIdsCommaSeparated")}
                  className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-600 dark:bg-blue-950 dark:text-gray-200"
                />
              ) : null}
            </div>
          ) : null}

          <Button
            className="mt-3 w-full"
            disabled={!canAdd}
            onClick={() => {
              onAddConfigured({
                optionId: resolvedOptionId as AggregationMethod,
                joinedBeforeDate: needsDate ? joinedBeforeDate : undefined,
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
            {t("addAggregation")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActiveAggregationsList({
  listItems,
  onToggleEnabled,
  onRemoveSelected,
  onHoverOption,
}: Pick<
  Props,
  "listItems" | "onToggleEnabled" | "onRemoveSelected" | "onHoverOption"
>) {
  const t = useTranslations();

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-700-dark">
        {t("aggregations")}
      </h2>
      {listItems.length > 0 ? (
        <div className="mt-2 divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-300 dark:divide-gray-600 dark:border-gray-600">
          {listItems.map((item) => (
            <AggregationListRow
              key={item.id}
              item={item}
              onToggle={() => onToggleEnabled(item.id)}
              onRemove={() => onRemoveSelected(item.id)}
              onMouseEnter={() => onHoverOption?.(item.id)}
              onMouseLeave={() => onHoverOption?.(null)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-600-dark">
          {t("noAggregationsSelected")}
        </p>
      )}
    </div>
  );
}

function AggregationListRow({
  item,
  onToggle,
  onRemove,
  onMouseEnter,
  onMouseLeave,
}: {
  item: AggregationListItem;
  onToggle: () => void;
  onRemove: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const t = useTranslations();
  const showActiveColor =
    item.enabled && item.activeColor && !item.isError && !item.isNoData;

  return (
    <div
      className="flex cursor-pointer items-center gap-1.5 bg-white py-1 pl-2 pr-0.5 text-xs transition hover:bg-gray-100 dark:bg-blue-950 dark:text-gray-200 dark:hover:bg-blue-900/40"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={item.enabled ? t("hideAggregation") : t("showAggregation")}
      aria-pressed={item.enabled}
    >
      <span
        className="inline-flex w-4 shrink-0 items-center justify-center"
        style={showActiveColor ? { color: item.activeColor } : undefined}
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
              !item.enabled ? "text-gray-400 dark:text-gray-500" : undefined
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
        className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={t("removeAggregation")}
      >
        <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
      </button>
    </div>
  );
}
