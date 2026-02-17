"use client";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";

type LegendItem = {
  id: string;
  label: string;
  color: string;
};

type Props = {
  legendItems: LegendItem[];
  selectedFamilies: Set<string>;
  hoveredFamily: string | null;
  onToggleFamily: (family: string) => void;
  onHoverFamily: (family: string | null) => void;
  onClearSelection: () => void;
  showProjection?: boolean;
  onToggleProjection?: () => void;
};

export function BenchmarkChartLegend({
  legendItems,
  selectedFamilies,
  hoveredFamily,
  onToggleFamily,
  onHoverFamily,
  onClearSelection,
  showProjection,
  onToggleProjection,
}: Props) {
  const { getThemeColor } = useAppTheme();

  return (
    <>
      {/* Interactive Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {legendItems.map((item) => {
          const isSelected = selectedFamilies.has(item.id);
          const isHovered = hoveredFamily === item.id;
          const isInactive =
            selectedFamilies.size > 0 && !isSelected && !isHovered;
          const isDimmed = hoveredFamily !== null && !isHovered;
          const borderClasses = isSelected
            ? "border-2 border-blue-600 dark:border-blue-400"
            : isHovered
              ? "border-2 border-blue-400 dark:border-blue-600"
              : "border-2 border-transparent";
          const backgroundClasses = isInactive ? "bg-muted/50" : "bg-card";
          const opacityClass = isDimmed
            ? "opacity-35"
            : isInactive
              ? "opacity-50"
              : "";
          return (
            <button
              key={item.id}
              onClick={() => onToggleFamily(item.id)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") {
                  onHoverFamily(item.id);
                }
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") {
                  onHoverFamily(null);
                }
              }}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-150 ${borderClasses} ${backgroundClasses} ${opacityClass}`}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground text-xs font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
        {selectedFamilies.size > 0 && (
          <button
            onClick={onClearSelection}
            className="text-muted-foreground hover:text-foreground px-2 py-1 text-xs underline"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Reference benchmarks, SOTA legend, and projection toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <svg width="32" height="2" className="shrink-0">
            <line
              x1="0"
              y1="1"
              x2="32"
              y2="1"
              stroke={getThemeColor(METAC_COLORS["mc-option"][3])}
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
          </svg>
          <span
            style={{ color: getThemeColor(METAC_COLORS["mc-option"][3]) }}
            className="font-medium"
          >
            Frontier Model Trend
          </span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="32" height="2" className="shrink-0">
            <line
              x1="0"
              y1="1"
              x2="32"
              y2="1"
              stroke={getThemeColor(METAC_COLORS.purple[700])}
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
          </svg>
          <span
            style={{ color: getThemeColor(METAC_COLORS.purple[700]) }}
            className="font-medium"
          >
            Human Baselines
          </span>
        </div>

        {onToggleProjection && (
          <>
            <div className="hidden h-4 w-px bg-gray-300 dark:bg-gray-600 sm:block" />
            <button
              onClick={onToggleProjection}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
                showProjection
                  ? "bg-futureeval-primary-light/15 text-futureeval-primary-light dark:bg-futureeval-primary-dark/15 dark:text-futureeval-primary-dark"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                {showProjection ? (
                  <>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </>
                ) : (
                  <>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </>
                )}
              </svg>
              {showProjection ? "Hide Projection" : "Show Projection"}
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default BenchmarkChartLegend;
