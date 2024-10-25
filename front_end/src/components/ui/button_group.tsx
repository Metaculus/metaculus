import classNames from "classnames";

import Button, { ButtonVariant } from "@/components/ui/button";

export type GroupButton<T> = {
  value: T;
  label: string;
};

type Props<T> = {
  value: T;
  buttons: GroupButton<T>[];
  onChange: (value: T) => void;
  onClick?: (value: string) => void;
  variant?: ButtonVariant;
  activeVariant?: ButtonVariant;
};

const ButtonGroup = <T extends string>({
  value,
  buttons,
  onChange,
  onClick,
  variant,
  activeVariant = "primary",
}: Props<T>) => {
  return (
    <div className="flex">
      {buttons.map((button, index) => (
        <Button
          key={button.value}
          variant={button.value === value ? activeVariant : variant}
          onClick={() => {
            onChange(button.value);
            onClick && onClick(button.label);
          }}
          className={classNames(
            "relative hover:z-10 focus:z-20",
            buttons.length > 1 &&
              (index === 0
                ? "rounded-r-none"
                : index !== buttons.length - 1
                  ? "ml-[-1px] rounded-none"
                  : "ml-[-1px] rounded-l-none")
          )}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
};

export default ButtonGroup;
