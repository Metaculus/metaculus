import { FC, PropsWithChildren, ReactNode, useMemo } from "react";

import cn from "@/utils/core/cn";

type InputContainerProps = {
  labelText?: string;
  explanation?: ReactNode;
  className?: string;
  isNativeFormControl?: boolean;
};

export const InputContainer: FC<PropsWithChildren<InputContainerProps>> = ({
  labelText,
  explanation,
  className,
  isNativeFormControl = true,
  children,
}) => {
  const InputElement: ReactNode = useMemo(() => {
    if (!labelText) {
      return children;
    }

    if (isNativeFormControl) {
      return (
        <label className="flex flex-col gap-1.5 text-sm font-bold capitalize text-gray-600 dark:text-gray-600-dark">
          {labelText}
          {children}
        </label>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold capitalize text-gray-600 dark:text-gray-600-dark">
          {labelText}
        </span>
        {children}
      </div>
    );
  }, [children, isNativeFormControl, labelText]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {InputElement}
      {!!explanation && (
        <span className="text-xs text-gray-700 dark:text-gray-700-dark">
          {explanation}
        </span>
      )}
    </div>
  );
};
