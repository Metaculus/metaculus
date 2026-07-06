import { faRobot, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import {
  faCog,
  faNewspaper,
  faSquarePollVertical,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { HTMLAttributes } from "react";

import cn from "@/utils/core/cn";

import { KFType } from "./types";

const KeyFactorsTypePicker: React.FC<{
  onPick: (t: KFType) => void;
  className?: string;
  withLLM?: boolean;
}> = ({ onPick, className, withLLM = false }) => {
  const t = useTranslations();

  return (
    <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-3", className)}>
      {ITEMS.map((item) => (
        <KeyFactorsTypePickerItem
          key={item.value}
          onClick={() => onPick(item.value)}
          title={item.label}
          description={item.description}
          icon={item.icon}
        />
      ))}
      {withLLM && (
        <KeyFactorsTypePickerItem
          key="ask_llm"
          icon={faRobot}
          title={t("askAnLLMTitle")}
          description={t("askAnLLMDescription")}
          btnClassName="bg-purple-100 sm:col-span-3 dark:bg-purple-100-dark hover:bg-purple-200 dark:hover:bg-purple-200-dark"
          iconClassName="text-purple-600 dark:text-purple-600-dark"
          onClick={() => onPick("ask_llm")}
        />
      )}
    </div>
  );
};

const KeyFactorsTypePickerItem: React.FC<
  {
    title?: string;
    description?: string;
    icon?: IconDefinition;
    btnClassName?: string;
    iconClassName?: string;
  } & HTMLAttributes<HTMLButtonElement>
> = ({ onClick, title, description, icon, btnClassName, iconClassName }) => {
  return (
    <button
      className={cn(
        "flex flex-col items-start rounded-[4px] bg-blue-200 p-5 text-left antialiased transition-colors duration-200 hover:bg-blue-300 dark:bg-blue-200-dark dark:hover:bg-blue-300-dark",
        btnClassName
      )}
      onClick={onClick}
    >
      {icon && (
        <FontAwesomeIcon
          className={cn(
            "mb-6 text-2xl text-blue-600 opacity-50 dark:text-blue-600-dark",
            iconClassName
          )}
          icon={icon}
        />
      )}
      <p className="my-0 mb-1 text-lg font-medium text-blue-800 dark:text-blue-800-dark">
        {title}
      </p>
      <p className="my-0 text-sm text-blue-800 dark:text-blue-800-dark">
        {description}
      </p>
    </button>
  );
};

const ITEMS: {
  label: string;
  description: string;
  value: KFType;
  icon: IconDefinition;
}[] = [
  {
    label: "Base Rate",
    description: "A historical frequency or reference class with data.",
    value: "base_rate",
    icon: faSquarePollVertical,
  },
  {
    label: "Driver",
    description: "An idea or argument that may influence the outcome.",
    value: "driver",
    icon: faCog,
  },
  {
    label: "News",
    description: "A recent event or article that could affect the forecast.",
    value: "news",
    icon: faNewspaper,
  },
];

export default KeyFactorsTypePicker;
