import classNames from "classnames";
import * as React from "react";
import { FC, useEffect, useRef, useState } from "react";

import { ErrorResponse } from "@/types/fetch";

export type ErrorProps = {
  errors?: ErrorResponse;
  name: keyof ErrorResponse;
  className?: string;
};

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  errors?: ErrorResponse;
}

export const InputError: FC<ErrorProps> = ({ errors, name, className }) => {
  return (
    <>
      {errors && name in errors && (
        <span
          className={classNames(
            "text-xs text-metac-red-500 dark:text-metac-red-500-dark",
            className
          )}
        >
          {errors[name][0]}
        </span>
      )}
    </>
  );
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, name, errors, ...props }, ref) => {
    return (
      <>
        <input
          type={type}
          className={className}
          ref={ref}
          name={name}
          {...props}
        />
        {name && errors && <InputError name={name} errors={errors} />}
      </>
    );
  }
);
Input.displayName = "Input";
