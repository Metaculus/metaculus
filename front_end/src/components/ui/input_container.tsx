import classNames from "classnames";
import { FC, PropsWithChildren } from "react";

type InputContainerProps = {
  labelText?: string;
  explanation?: any;
  className?: string;
};

export const InputContainer: FC<PropsWithChildren<InputContainerProps>> = ({
  labelText,
  explanation,
  className,
  children,
}) => {
  return (
    <div className={classNames("flex flex-col gap-1.5", className)}>
      {labelText ? (
        <label className="flex flex-col gap-1.5 text-sm font-bold capitalize text-gray-600 dark:text-gray-600-dark">
          {labelText}
          {children}
        </label>
      ) : (
        children
      )}
      {explanation && (
        <span className="text-xs text-gray-700 dark:text-gray-700-dark">
          {explanation}
        </span>
      )}
    </div>
  );
};
