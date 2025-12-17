import { ReactNode } from "react";

import Button, { ButtonVariant } from "@/components/ui/button";
import cn from "@/utils/core/cn";

export type GroupButton<T> = {
  value: T;
  label: string | ReactNode;
  href?: string;
};

type Props<T> = {
  value: T;
  buttons: GroupButton<T>[];
  onChange: (value: T) => void;
  onClick?: (value: string | ReactNode) => void;
  variant?: ButtonVariant;
  activeVariant?: ButtonVariant;
  className?: string;
  activeClassName?: string;
  containerClassName?: string;
};

const ButtonGroup = <T extends string>({
  value,
  buttons,
  onChange,
  onClick,
  variant,
  activeVariant = "primary",
  className,
  containerClassName,
  activeClassName,
}: Props<T>) => {
  return (
    <div className={cn("flex", containerClassName)}>
      {buttons.map((button, index) => (
        <Button
          key={button.value}
          variant={button.value === value ? activeVariant : variant}
          onClick={() => {
            onChange(button.value);
            onClick?.(button.label);
          }}
          href={button.href}
          className={cn(
            "relative hover:z-10 focus:z-20",
            buttons.length > 1 &&
              (index === 0
                ? "rounded-r-none"
                : index !== buttons.length - 1
                  ? "ml-[-1px] rounded-none"
                  : "ml-[-1px] rounded-l-none"),
            value === button.value ? activeClassName : className
          )}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
};

export default ButtonGroup;
