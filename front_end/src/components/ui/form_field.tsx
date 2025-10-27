"use client";
import { MDXEditorMethods } from "@mdxeditor/editor";
import * as React from "react";
import { FC, useEffect, useMemo, useRef } from "react";
import {
  Control,
  FieldValues,
  Path,
  PathValue,
  useController,
} from "react-hook-form";
import { mergeRefs } from "react-merge-refs";

import MarkdownEditor from "@/components/markdown_editor";
import Checkbox from "@/components/ui/checkbox";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { ErrorResponse } from "@/types/fetch";
import cn from "@/utils/core/cn";
import { extractError } from "@/utils/core/errors";

export type ErrorProps = {
  errors?: ErrorResponse;
  name?: keyof ErrorResponse;
  className?: string;
  strict?: boolean;
  detached?: boolean;
};

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  errors?: ErrorResponse;
}

export interface TextAreaProps
  extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  errors?: ErrorResponse;
  rows?: number;
}

export const FormError: FC<ErrorProps> = ({
  errors,
  name,
  className,
  detached,
}) => {
  /**
   * If null => display only if no other things
   * */
  const [errorText, setErrorText] = React.useState<unknown>();
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
        setErrorText(errors?.non_field_errors || errors?.message);
      } else if (name && name in errors) {
        setErrorText(errors[name]);
      } else if (!name && Object.keys(errors).length > 0) {
        setErrorText(extractError(errors, { detached }));
      } else {
        setErrorText(undefined);
      }
    } else {
      setErrorText(undefined);
    }
  }, [errors, name, detached]);
  return (
    <FormErrorMessage
      errors={errorText}
      className={className}
      detached={detached}
    />
  );
};

export const FormErrorMessage: FC<{
  errors: unknown;
  containerClassName?: string;
  className?: string;
  detached?: boolean;
}> = ({ errors, containerClassName, className, detached }) => {
  const message = useMemo(
    () => (errors ? extractError(errors, { detached }) : null),
    [detached, errors]
  );

  return (
    <>
      {message && (
        <div className={containerClassName}>
          <span
            className={cn(
              "whitespace-pre-wrap text-xs text-red-500 dark:text-red-500-dark",
              className
            )}
          >
            {message}
          </span>
        </div>
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
          className={cn("rounded-s border p-1", className)}
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

type DateInputProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  defaultValue?: PathValue<T, Path<T>>;
  errors?: ErrorResponse;
  className?: string;
};
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ control, name, errors, defaultValue, className }, ref) => {
    const { field } = useController({ control, name, defaultValue });

    return (
      <>
        <DatetimeUtc
          ref={mergeRefs([field.ref, ref])}
          className={className}
          name={field.name}
          defaultValue={field.value}
          onChange={(value) => {
            if (!value) {
              field.onChange(null);
              return;
            }

            field.onChange(value);
          }}
          onBlur={field.onBlur}
          withFormValidation
        />
        {errors && <FormError name={name} errors={errors} />}
      </>
    );
  }
);
DateInput.displayName = "DateInput";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, name, children, errors, ...props }, ref) => {
    return (
      <>
        <textarea
          className={cn("block rounded-s border p-1", className)}
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

type MarkdownEditorFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  defaultValue?: PathValue<T, Path<T>>;
  errors?: ErrorResponse;
  className?: string;
  withCodeBlocks?: boolean;
};

export const MarkdownEditorField = <T extends FieldValues = FieldValues>({
  control,
  name,
  errors,
  defaultValue,
  className,
  withCodeBlocks,
}: MarkdownEditorFieldProps<T>) => {
  const { field } = useController({ control, name, defaultValue });
  const editorRef = useRef<MDXEditorMethods>(null);
  const isMounted = useRef(false);

  // populate the editor with draft form value when
  useEffect(() => {
    const editorValue = editorRef.current?.getMarkdown();
    if (!editorValue && !isMounted.current && field.value) {
      editorRef.current?.setMarkdown(field.value);
      isMounted.current = true;
    }
  }, [field.value]);

  return (
    <>
      <div
        className={cn(
          "relative max-h-[80vh] overflow-y-scroll rounded border border-gray-500 dark:border-gray-500-dark",
          className
        )}
      >
        {/* This input is used to support following logic fron native forms
           - populate FormData with input value when submitting via form action
           - auto-scroll and focus input when validation error occurs
         */}
        <Textarea
          className="hidden-scrollable-input pointer-events-none"
          {...field}
          readOnly
          onFocus={() => {
            editorRef.current?.focus();
          }}
        />

        <MarkdownEditor
          ref={editorRef}
          mode="write"
          markdown={field.value ?? ""}
          onChange={(markdown) => {
            field.onChange(markdown);
          }}
          onBlur={field.onBlur}
          className="markdown-editor-form w-full"
          withCodeBlocks={withCodeBlocks}
        />
      </div>
      {errors && (
        <FormError
          name={name}
          errors={errors}
          className="text-sm font-bold capitalize"
        />
      )}
    </>
  );
};

type CheckboxFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  defaultValue?: PathValue<T, Path<T>>;
  label: string;
  disabled?: boolean;
  errors?: ErrorResponse;
  inputClassName?: string;
  className?: string;
};

export const CheckboxField = <T extends FieldValues = FieldValues>({
  control,
  name,
  defaultValue,
  label,
  disabled,
  errors,
  ...restProps
}: CheckboxFieldProps<T>) => {
  const { field } = useController({ control, name, defaultValue });

  return (
    <>
      <Checkbox
        checked={field.value}
        onChange={field.onChange}
        disabled={disabled}
        label={label}
        {...restProps}
      />
      {errors && <FormError name={name} errors={errors} />}
    </>
  );
};
