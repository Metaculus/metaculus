import { faSquare, faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Checkbox as HeadlessCheckbox, Field } from "@headlessui/react";
import { FC, MouseEventHandler, ReactNode, TouchEventHandler } from "react";

import { FormError } from "@/components/ui/form_field";
import { ErrorResponse } from "@/types/fetch";
import cn from "@/utils/core/cn";

type Props = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  inputClassName?: string;
  className?: string;
  color?: string;
  children?: ReactNode;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onTouchStart?: TouchEventHandler<HTMLDivElement>;
  onTouchMove?: TouchEventHandler<HTMLDivElement>;
  onClick?: MouseEventHandler<HTMLSpanElement>;
  readOnly?: boolean;
  errors?: ErrorResponse;
  labelClassName?: string;
};

const Checkbox: FC<Props> = ({
  checked,
  defaultChecked,
  onChange,
  disabled,
  label,
  children,
  inputClassName,
  className,
  color,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onClick,
  readOnly,
  errors,
}) => {
  return (
    <Field
      className={cn("hover:cursor-pointer", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      disabled={disabled}
    >
      <HeadlessCheckbox
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        onClick={(e) => {
          if (readOnly) {
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
          onClick?.(e);
        }}
        className={cn(
          "flex w-full items-center rounded border border-gray-400 px-4 py-3 hover:bg-blue-100 focus:outline-none dark:border-gray-400-dark dark:hover:bg-blue-100-dark lg:py-4",
          {
            "border-olive-700 bg-olive-300 hover:bg-olive-400 dark:border-olive-700-dark dark:bg-olive-300-dark dark:hover:bg-olive-400-dark":
              checked,
          }
        )}
      >
        {({ checked }) => (
          <>
            {checked ? (
              <FontAwesomeIcon
                icon={faSquareCheck}
                size="xl"
                className={cn("mr-1", inputClassName, {
                  "opacity-20": disabled,
                })}
                color={color}
              />
            ) : (
              <FontAwesomeIcon
                icon={faSquare}
                size="xl"
                className={cn("mr-1", inputClassName, {
                  "opacity-20": disabled,
                })}
                color={color}
              />
            )}
            <span className="flex-1 text-blue-800 dark:text-blue-800-dark">
              {children ? children : label}
            </span>
          </>
        )}
      </HeadlessCheckbox>
      {errors && <FormError errors={errors} name={label} />}
    </Field>
  );
};

export default Checkbox;
