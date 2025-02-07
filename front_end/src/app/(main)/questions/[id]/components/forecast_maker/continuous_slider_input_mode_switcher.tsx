import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { ForecastInputType } from "@/types/charts";
import cn from "@/utils/cn";

type Props = {
  mode: string;
  onChange: (mode: ForecastInputType) => void;
};

const SliderInputModeSwitcher: FC<Props> = ({ mode, onChange }) => {
  const t = useTranslations();
  return (
    <div className="flex h-fit gap-1">
      <SwitcherBtn
        onChange={onChange}
        mode={mode}
        value={ForecastInputType.Slider}
      >
        {t("slider")}
      </SwitcherBtn>
      <SwitcherBtn
        onChange={onChange}
        mode={mode}
        value={ForecastInputType.Quantile}
      >
        {t("table")}
      </SwitcherBtn>
    </div>
  );
};

type SwitcherBtnProps = {
  value: ForecastInputType;
  mode: string;
  onChange: (mode: ForecastInputType) => void;
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

export default SliderInputModeSwitcher;
