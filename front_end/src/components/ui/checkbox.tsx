import { faSquare, faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import {
  faSquare as faSquareSolid,
  faCheck as faCheckSolid,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Checkbox as HeadlessCheckbox, Field, Label } from "@headlessui/react";
import { FC, MouseEventHandler, ReactNode, TouchEventHandler } from "react";

import { ErrorResponse } from "@/types/fetch";
import cn from "@/utils/core/cn";

import { FormError } from "./form_field";

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
  isSolidIcon?: boolean;
};

const SolidBox: FC<{
  checked: boolean;
  disabled?: boolean;
  color?: string;
  inputClassName?: string;
}> = ({ checked, disabled, color, inputClassName }) => {
  const style = checked
    ? { backgroundColor: color, borderColor: "transparent" }
    : { backgroundColor: "transparent", borderColor: color };

  return (
    <span
      className={cn(
        "mr-[4px] inline-flex h-[17.75px] w-[22.5px] items-center justify-center"
      )}
      aria-hidden
    >
      <span
        className={cn(
          "inline-flex h-[15.75px] w-[15.75px] items-center justify-center rounded-[2.25px] border-[1px]",
          inputClassName,
          { "opacity-20": disabled }
        )}
        style={style}
      >
        {checked && (
          <FontAwesomeIcon
            icon={faCheckSolid}
            size="sm"
            color="#fff"
            fixedWidth
          />
        )}
      </span>
    </span>
  );
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
  isSolidIcon = false,
}) => {
  return (
    <Field
      className={cn("flex items-center hover:cursor-pointer", className)}
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
        className="focus:outline-none"
      >
        {({ checked }) =>
          checked ? (
            isSolidIcon ? (
              <SolidBox
                checked
                disabled={disabled}
                color={color}
                inputClassName={inputClassName}
              />
            ) : (
              <FontAwesomeIcon
                icon={faSquareCheck}
                size="xl"
                fixedWidth
                className={cn("mr-1", inputClassName, {
                  "opacity-20": disabled,
                })}
                color={color}
              />
            )
          ) : isSolidIcon ? (
            <SolidBox
              checked={false}
              disabled={disabled}
              color={color}
              inputClassName={inputClassName}
            />
          ) : (
            <FontAwesomeIcon
              icon={isSolidIcon ? faSquareSolid : faSquare}
              size="xl"
              fixedWidth
              className={cn("mr-1", inputClassName, { "opacity-20": disabled })}
              color={color}
            />
          )
        }
      </HeadlessCheckbox>
      {errors && <FormError errors={errors} name={label} />}
      <Label className="CheckboxLabel -ml-[2px] text-gray-900 hover:cursor-pointer dark:text-gray-900-dark">
        {children ? children : label}
      </Label>
    </Field>
  );
};

export default Checkbox;
