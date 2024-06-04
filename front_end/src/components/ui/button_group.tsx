import classNames from "classnames";

import Button, { ButtonVariant } from "@/components/ui/button";

export type GroupButton<T> = {
  id: T;
  label: string;
};

type Props<T> = {
  value: T;
  buttons: GroupButton<T>[];
  onChange: (id: T) => void;
  variant?: ButtonVariant;
  activeVariant?: ButtonVariant;
};

const ButtonGroup = <T extends string>({
  value,
  buttons,
  onChange,
  variant,
  activeVariant = "primary",
}: Props<T>) => {
  return (
    <div className="flex">
      {buttons.map((button, index) => (
        <Button
          key={button.id}
          variant={button.id === value ? activeVariant : variant}
          onClick={() => onChange(button.id)}
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
