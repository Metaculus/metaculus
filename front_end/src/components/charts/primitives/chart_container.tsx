"use client";
import { Tab, TabGroup, TabList } from "@headlessui/react";
import { isNil } from "lodash";
import {
  forwardRef,
  Fragment,
  PropsWithChildren,
  ReactNode,
  useState,
} from "react";

import { useIsEmbedMode } from "@/app/(embed)/questions/components/question_view_mode_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { getChartZoomOptions } from "@/utils/charts/helpers";
import cn from "@/utils/core/cn";

type Props = {
  height: number;
  zoom?: TimelineChartZoomOption;
  onZoomChange?: (zoom: TimelineChartZoomOption) => void;
  chartTitle?: ReactNode;
  headerLeft?: ReactNode;
  leftLegend?: React.ReactNode;
  headerExtra?: React.ReactNode;
};

const ChartContainer = forwardRef<HTMLDivElement, PropsWithChildren<Props>>(
  (
    {
      height,
      zoom,
      onZoomChange,
      children,
      chartTitle,
      headerLeft,
      leftLegend,
      headerExtra,
    },
    ref
  ) => {
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
        {(!!chartTitle || !!headerLeft || !!zoom || !!headerExtra) &&
          !isEmbed && (
            <div
              className={cn(
                "flex w-full",
                !!headerLeft
                  ? "flex-col items-start gap-1 md:flex-row md:items-center md:gap-0"
                  : "items-center",
                !isEmbed ? "mb-2.5 md:mb-5" : "mb-3"
              )}
            >
              {!!headerLeft ? (
                <div className="flex w-full min-w-0 flex-col gap-1 md:flex-1">
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
                  {headerLeft}
                </div>
              ) : !!chartTitle ? (
                <div
                  className={cn(
                    isEmbed
                      ? "text-xs text-gray-600 dark:text-gray-600-dark"
                      : "text-xs font-normal text-blue-900 dark:text-gray-900-dark md:text-base"
                  )}
                >
                  {chartTitle}
                </div>
              ) : null}
              {(!!zoom || !!headerExtra) && (
                <div
                  className={cn(
                    "ChartZoomControls items-center gap-2 self-end",
                    !!headerExtra ? "flex" : "hidden md:flex",
                    !!headerLeft ? "md:ml-auto" : "ml-auto"
                  )}
                >
                  {!!zoom && (
                    <div className="ChartZoomControls hidden md:flex">
                      <TabGroup
                        selectedIndex={selectedIndex}
                        onChange={handleTabChange}
                        manual
                      >
                        <TabList className="flex gap-0.5">
                          {tabOptions.map((option) => (
                            <Tab as={Fragment} key={option.value}>
                              {({ selected, hover }) => (
                                <button
                                  className={cn(
                                    "ChartZoomButton rounded px-1 py-0.5 text-xs font-normal uppercase leading-4 text-gray-600 hover:text-blue-800 focus:outline-none dark:text-gray-600-dark hover:dark:text-blue-800-dark md:text-sm",
                                    {
                                      "text-gray-900 dark:text-gray-900-dark":
                                        selected,
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
                    </div>
                  )}
                  {headerExtra}
                </div>
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
