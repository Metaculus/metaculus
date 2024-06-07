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
    <>
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
