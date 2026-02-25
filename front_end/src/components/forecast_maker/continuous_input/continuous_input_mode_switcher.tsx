import { faArrowLeft, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { ContinuousForecastInputType } from "@/types/charts";
import cn from "@/utils/core/cn";

type Props = {
  mode: ContinuousForecastInputType;
  onChange: (mode: ContinuousForecastInputType) => void;
};

const ContinuousInputModeSwitcher: FC<Props> = ({ mode, onChange }) => {
  const t = useTranslations();
  return (
    <div className="flex h-fit flex-col gap-1">
      <div className="flex gap-1">
        <SwitcherBtn
          onChange={onChange}
          mode={mode}
          value={ContinuousForecastInputType.Slider}
        >
          {t("slider")}
        </SwitcherBtn>
        <SwitcherBtn
          onChange={onChange}
          mode={mode}
          value={ContinuousForecastInputType.Quantile}
        >
          {t("table")}
        </SwitcherBtn>
      </div>
      {mode === ContinuousForecastInputType.Quantile && (
        <p className="m-0 text-xs text-gray-600 dark:text-gray-600-dark">
          <FontAwesomeIcon
            icon={faArrowUp}
            className="mr-0.5"
            size="xs"
          />
          <FontAwesomeIcon
            icon={faArrowLeft}
            className="mr-1"
            size="xs"
          />
          {t("switchBackToSlidersHint")}
        </p>
      )}
    </div>
  );
};

type SwitcherBtnProps = {
  value: ContinuousForecastInputType;
  mode: string;
  onChange: (mode: ContinuousForecastInputType) => void;
};

const SwitcherBtn: FC<PropsWithChildren<SwitcherBtnProps>> = ({
  value,
  mode,
  onChange,
  children,
}) => {
  const isActive = mode === value;
  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        "px-2 py-1 text-blue-800 transition-all duration-200 hover:bg-gray-0 dark:text-blue-800-dark dark:hover:bg-gray-0-dark",
        isActive &&
          "rounded bg-blue-700 text-gray-0 hover:bg-blue-800 dark:bg-blue-700-dark dark:text-gray-0-dark dark:hover:bg-blue-800-dark"
      )}
    >
      {children}
    </button>
  );
};

export default ContinuousInputModeSwitcher;
