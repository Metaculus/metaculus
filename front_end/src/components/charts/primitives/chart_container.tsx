"use client";
import { Tab, TabGroup, TabList } from "@headlessui/react";
import { isNil } from "lodash";
import { forwardRef, Fragment, PropsWithChildren, useState } from "react";

import { useIsEmbedMode } from "@/app/(embed)/questions/components/question_view_mode_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { getChartZoomOptions } from "@/utils/charts/helpers";
import cn from "@/utils/core/cn";

type Props = {
  height: number;
  zoom?: TimelineChartZoomOption;
  onZoomChange?: (zoom: TimelineChartZoomOption) => void;
  chartTitle?: string;

  leftLegend?: React.ReactNode;
};

const ChartContainer = forwardRef<HTMLDivElement, PropsWithChildren<Props>>(
  ({ height, zoom, onZoomChange, children, chartTitle, leftLegend }, ref) => {
    const tabOptions = getChartZoomOptions();
    const [selectedIndex, setSelectedIndex] = useState(
      tabOptions.findIndex((option) => option.value === zoom)
    );

    const handleTabChange = (index: number) => {
      setSelectedIndex(index);
      const tabOption = tabOptions[index];
      if (onZoomChange && !isNil(tabOption)) {
        onZoomChange(tabOption.value);
      }
    };

    const isEmbed = useIsEmbedMode();

    return (
      <div className="relative flex w-full flex-col">
        {(!!chartTitle || !!zoom) && !isEmbed && (
          <div
            className={cn("flex w-full", !isEmbed ? "mb-2.5 md:mb-5" : "mb-3")}
          >
            {!!chartTitle && (
              <div
                className={cn(
                  isEmbed
                    ? "text-xs text-gray-600 dark:text-gray-600-dark"
                    : "text-xs font-normal text-blue-900 dark:text-gray-900-dark md:text-base"
                )}
              >
                {chartTitle}
              </div>
            )}
            {!!zoom && (
              <TabGroup
                selectedIndex={selectedIndex}
                onChange={handleTabChange}
                manual
                className="ml-auto self-end"
              >
                <TabList className="flex gap-0.5">
                  {tabOptions.map((option) => (
                    <Tab as={Fragment} key={option.value}>
                      {({ selected, hover }) => (
                        <button
                          className={cn(
                            "ChartZoomButton rounded px-1 py-0.5 text-xs font-normal leading-4 text-gray-600 hover:text-blue-800 focus:outline-none dark:text-gray-600-dark hover:dark:text-blue-800-dark md:text-sm",
                            {
                              "text-gray-900 dark:text-gray-900-dark": selected,
                            },
                            {
                              "bg-gray-300 dark:bg-gray-300-dark":
                                hover || selected,
                            },
                            isEmbed &&
                              "uppercase text-gray-600 dark:text-gray-600-dark md:text-xs"
                          )}
                        >
                          {option.label}
                        </button>
                      )}
                    </Tab>
                  ))}
                </TabList>
              </TabGroup>
            )}
          </div>
        )}

        {leftLegend ? (
          <div
            className="mt-3 grid w-full grid-cols-[auto_1fr] gap-4 sm:gap-6"
            style={{ height }}
          >
            <div className="h-full self-start">
              <div className="flex h-full items-center">{leftLegend}</div>
            </div>

            <div ref={ref} style={{ height }} className="w-full">
              {children}
            </div>
          </div>
        ) : (
          <div ref={ref} style={{ height }} className="w-full">
            {children}
          </div>
        )}
      </div>
    );
  }
);
ChartContainer.displayName = "ChartContainer";
export default ChartContainer;
