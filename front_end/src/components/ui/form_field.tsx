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
  label?: string;
  errors?: ErrorResponse;
}

export interface TextAreaProps
  extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  errors?: ErrorResponse;
}

export interface SelectProps
  extends React.InputHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  label?: string;
  errors?: ErrorResponse;
}

export const FormError: FC<ErrorProps> = ({ errors, name, className }) => {
  /**
   * If null => display only if no other things
   * */
  const [errorText, setErrorText] = React.useState<string | undefined>();

  useEffect(() => {
    if (errors) {
      if (
        name === null &&
        Object.keys(errors).every((k) => k in ["message", "non_field_errors"])
      ) {
        setErrorText(errors?.non_field_errors?.[0] || errors?.message);
      } else if (name && name in errors) {
        setErrorText(errors[name]?.[0]);
      } else {
        setErrorText(undefined);
      }
    } else {
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
  ({ className, type, name, label, errors, ...props }, ref) => {
    return (
      <div className="flex w-full flex-row justify-between">
        {label ? <span className="mr-2 min-w-[160px]">{label}:</span> : <></>}
        <input
          type={type}
          className={`w-full rounded-s border border-white p-1 ${className}`}
          ref={ref}
          name={name}
          {...props}
        />
        {errors && <FormError name={name ? name : label} errors={errors} />}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, name, children, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? <span className="block">{label}</span> : <></>}
        <textarea
          className={`block w-full rounded-s border border-white p-1 ${className}`}
          name={name}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, name, children, label, options, ...props }, ref) => {
    return (
      <div className="flex w-full flex-row justify-between">
        {label ? <span className="mr-2 min-w-[120px]">{label}</span> : <></>}
        <select
          className={`w-full rounded-s border border-white p-1 ${className}`}
          name={name}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
