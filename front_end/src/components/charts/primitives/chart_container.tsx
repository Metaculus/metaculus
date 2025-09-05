"use client";
import { Tab, TabGroup, TabList } from "@headlessui/react";
import { isNil } from "lodash";
import { forwardRef, Fragment, PropsWithChildren, useState } from "react";

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

    return (
      <div className="relative flex w-full flex-col">
        {(!!chartTitle || !!zoom) && (
          <div className="mb-2.5 flex w-full md:mb-5">
            {!!chartTitle && (
              <div className="text-xs font-normal text-blue-900 dark:text-gray-900-dark md:text-base">
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
                            }
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
