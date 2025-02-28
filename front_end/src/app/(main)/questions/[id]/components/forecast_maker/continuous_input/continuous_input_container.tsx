import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useState } from "react";

import Checkbox from "@/components/ui/checkbox";
import Switch from "@/components/ui/switch";
import Tooltip from "@/components/ui/tooltip";
import {
  ContinuousAreaGraphType,
  ContinuousForecastInputType,
} from "@/types/charts";
import { UserForecast } from "@/types/question";
import cn from "@/utils/cn";

import ContinuousInputModeSwitcher from "./continuous_input_mode_switcher";

export type ContinuousInputContainerProps = {
  forecastInputMode: ContinuousForecastInputType;
  onInputModeChange: (mode: ContinuousForecastInputType) => void;
  overlayPreviousForecast: boolean;
  onOverlayPreviousForecastChange: (value: boolean) => void;
  previousForecast?: UserForecast;
  menu?: ReactNode;
  children?: (graphType: ContinuousAreaGraphType) => ReactNode;
};

const ContinuousInputContainer: FC<ContinuousInputContainerProps> = ({
  forecastInputMode,
  onInputModeChange,
  overlayPreviousForecast,
  previousForecast,
  onOverlayPreviousForecastChange,
  menu,
  children,
}) => {
  const t = useTranslations();

  const [graphType, setGraphType] = useState<ContinuousAreaGraphType>("pmf");

  return (
    <div className="mr-0 flex flex-col sm:mr-2">
      <div className="flex justify-between">
        <ContinuousInputModeSwitcher
          mode={forecastInputMode}
          onChange={onInputModeChange}
        />
        <div className="flex flex-col items-center gap-2 self-end">
          <div className="flex w-fit flex-row items-center gap-2 self-end">
            <p
              className={cn(
                "m-0 text-sm",
                graphType === "cdf" ? "opacity-60" : "opacity-90"
              )}
              title="probability density function"
            >
              {t("pdf")}
            </p>
            <Switch
              checked={graphType === "cdf"}
              onChange={(checked) => setGraphType(checked ? "cdf" : "pmf")}
            />
            <p
              className={cn(
                "m-0 text-sm",
                graphType === "cdf" ? "opacity-90" : "opacity-60"
              )}
              title="cumulative density function"
            >
              {t("cdf")}
            </p>
            <Tooltip
              showDelayMs={200}
              placement={"bottom"}
              tooltipContent="PDF (Probability Density Function) shows how likely different outcomes are around specific values, while CDF (Cumulative Distribution Function) shows the cumulative probability of outcomes up to a certain value."
              className=""
              tooltipClassName="text-center !max-w-[331px] !border-blue-400 dark:!border-blue-400-dark bg-gray-0 dark:bg-gray-0-dark !text-base !p-4"
            >
              <FontAwesomeIcon
                icon={faCircleQuestion}
                height={16}
                className="text-gray-500 hover:text-blue-800 dark:text-gray-500-dark dark:hover:text-blue-800-dark"
              />
            </Tooltip>
            {menu && (
              <div className="-mr-2 size-[26px] rounded-full bg-gray-100 dark:bg-gray-100-dark">
                {menu}
              </div>
            )}
          </div>
          {!!previousForecast && (
            <div className="ml-auto mr-auto mt-1 flex items-center md:-mr-1">
              <Checkbox
                checked={overlayPreviousForecast}
                onChange={onOverlayPreviousForecastChange}
                className={
                  "flex flex-row gap-2 text-sm text-gray-700 dark:text-gray-700-dark md:flex-row-reverse "
                }
                label={
                  !!previousForecast.end_time
                    ? t("overlayMostRecentForecast")
                    : t("overlayCurrentForecast")
                }
              />
            </div>
          )}
        </div>
      </div>
      {children?.(graphType)}
    </div>
  );
};

export default ContinuousInputContainer;
