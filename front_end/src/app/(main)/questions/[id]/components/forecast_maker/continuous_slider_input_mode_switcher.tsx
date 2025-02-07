import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { ForecastInputType } from "@/types/charts";
import cn from "@/utils/cn";

type Props = {
  mode: string;
  setMode: (mode: ForecastInputType) => void;
};

const SliderInputModeSwitcher: FC<Props> = ({ mode, setMode }) => {
  const t = useTranslations();
  return (
    <div className="flex h-fit gap-1">
      <SwitcherBtn setMode={setMode} mode={mode} value="slider">
        {t("slider")}
      </SwitcherBtn>
      <SwitcherBtn setMode={setMode} mode={mode} value="table">
        {t("table")}
      </SwitcherBtn>
    </div>
  );
};

type SwitcherBtnProps = {
  value: ForecastInputType;
  mode: string;
  setMode: (mode: ForecastInputType) => void;
};

const SwitcherBtn: FC<PropsWithChildren<SwitcherBtnProps>> = ({
  value,
  mode,
  setMode,
  children,
}) => {
  const isActive = mode === value;
  return (
    <button
      onClick={() => setMode(value)}
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
