import classNames from "classnames";
import * as React from "react";
import { FC, useEffect } from "react";

import { ErrorResponse } from "@/types/fetch";

export type ErrorProps = {
  errors?: ErrorResponse;
  name?: keyof ErrorResponse;
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

export interface SelectProps
  extends React.InputHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  errors?: ErrorResponse;
}

const extractError = (field_error: any): string | undefined => {
  console.log("extractError", field_error);

  if (typeof field_error === "string") return field_error;

  if (typeof field_error === "object" && field_error !== null) {
    for (const key in field_error) {
      if (field_error.hasOwnProperty(key)) {
        const result = extractError(field_error[key]);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
};

export const FormError: FC<ErrorProps> = ({ errors, name, className }) => {
  /**
   * If null => display only if no other things
   * */
  const [errorText, setErrorText] = React.useState<string | undefined>();
  useEffect(() => {
    if (errors) {
      if (errors.message) {
        setErrorText(extractError(errors.message));
      } else if (
        !name &&
        Object.keys(errors).every((k) =>
          ["message", "non_field_errors"].includes(k)
        )
      ) {
        setErrorText(extractError(errors?.non_field_errors || errors?.message));
      } else if (name && name in errors) {
        setErrorText(extractError(errors[name]));
      } else {
        setErrorText(undefined);
      }
    }
  }, [errors, name]);
  return (
    <div>
      {errorText && (
        <span
          className={classNames(
            "text-xs text-red-500 dark:text-red-500-dark",
            className
          )}
        >
          {errorText}
        </span>
      )}
    </div>
  );
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, name, errors, ...props }, ref) => {
    return (
      <>
        <input
          type={type}
          className={`rounded-s border border-white p-1 ${className}`}
          ref={ref}
          name={name}
          {...props}
        />
        {errors && <FormError name={name} errors={errors} />}
      </>
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, name, children, errors, ...props }, ref) => {
    return (
      <>
        <textarea
          className={classNames("block rounded-s border p-1", className)}
          ref={ref}
          name={name}
          {...props}
        />
        {errors && <FormError name={name} errors={errors} />}
      </>
    );
  }
);
Textarea.displayName = "Textarea";
