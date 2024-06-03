import classNames from "classnames";
import * as React from "react";
import { FC } from "react";

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

export interface TextAreaProps
  extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  errors?: ErrorResponse;
}

export const FormError: FC<ErrorProps> = ({ errors, name, className }) => {
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
        {name && errors && <FormError name={name} errors={errors} />}
      </>
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, name, children, ...props }, ref) => {
    return <textarea className={className} name={name} {...props} />;
  }
);
Textarea.displayName = "Textarea";
