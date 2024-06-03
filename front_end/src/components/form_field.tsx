import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  errors?: Record<string, string[]>;
}

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
        {name && errors && errors[name] && (
          <span className="text-xs text-metac-red-500 dark:text-metac-red-500-dark">
            {errors[name]}
          </span>
        )}
      </>
    );
  }
);
Input.displayName = "Input";
