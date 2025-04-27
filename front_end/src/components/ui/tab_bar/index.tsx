import { ReactNode } from "react";

import cn from "@/utils/core/cn";

import Tab from "./tab";

export type TabOption<T> = {
  value: T;
  label: string;
  className?: string;
  Icon?: ReactNode;
};

type Props<T> = {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

const TabBar = <T = string,>({
  options,
  value,
  onChange,
  className,
}: Props<T>) => {
  return (
    <div className={cn("flex", className)}>
      {options.map((option, index) => (
        <Tab
          key={`${option.value}`}
          onClick={() => {
            onChange(option.value);
          }}
          active={option.value === value}
          className={cn(
            "relative grow rounded hover:z-10 focus:z-20",
            options.length > 1 &&
              (index === 0
                ? "rounded-r-none"
                : index !== options.length - 1
                  ? "ml-[-1px] rounded-none"
                  : "ml-[-1px] rounded-l-none")
          )}
        >
          <span className="text-sm font-bold">{option.label}</span>
        </Tab>
      ))}
    </div>
  );
};

export default TabBar;
