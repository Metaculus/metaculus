import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Size = "small" | "default";

type Props = {
  checked: boolean;
  disabled?: boolean;
  size?: Size;
};

const RadioButton: FC<PropsWithChildren<Props>> = ({
  checked,
  size = "default",
  disabled,
  children,
}) => {
  return (
    <label
      className={cn(
        "inline-grid grid-cols-[1em_auto] items-center text-gray-900 dark:text-gray-900-dark",
        {
          "gap-1": size === "small",
          "gap-2": size === "default",
          "cursor-not-allowed opacity-20": disabled,
        }
      )}
    >
      <input
        className={cn(
          "m-0 flex appearance-none items-center justify-center rounded-full border border-gray-900 bg-inherit before:scale-0 before:rounded-full before:shadow-[inset_1em_1em] before:shadow-gray-900 before:transition-transform before:duration-100 before:ease-in-out before:content-[''] checked:before:scale-100 disabled:cursor-not-allowed dark:border-gray-900-dark before:dark:shadow-gray-900-dark",
          {
            "size-3 before:size-1.5": size === "small",
            "size-4 before:size-2": size === "default",
          }
        )}
        type="radio"
        checked={checked}
        disabled={disabled}
        readOnly
      />
      {children}
    </label>
  );
};

export default RadioButton;
