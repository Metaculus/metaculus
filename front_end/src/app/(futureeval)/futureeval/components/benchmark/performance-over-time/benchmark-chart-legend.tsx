"use client";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

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
};

export function BenchmarkChartLegend({
  legendItems,
  selectedFamilies,
  hoveredFamily,
  onToggleFamily,
  onHoverFamily,
  onClearSelection,
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

      {/* Reference benchmarks and SOTA legend */}
      <div className="mb-4 flex items-center gap-6 text-sm">
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
            SOTA Trend
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
      </div>
    </>
  );
}

export default BenchmarkChartLegend;
