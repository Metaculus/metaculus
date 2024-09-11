import { faSquare, faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Checkbox as HeadlessCheckbox, Field, Label } from "@headlessui/react";
import classNames from "classnames";
import { FC, MouseEventHandler, ReactNode, TouchEventHandler } from "react";

import { ErrorResponse } from "@/types/fetch";

import { FormError } from "./form_field";

type Props = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange: (checked: boolean) => void;
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
};

const Checkbox: FC<Props> = ({
  checked,
  defaultChecked,
  onChange,
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
      className={classNames("hover:cursor-pointer", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
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
          onClick && onClick(e);
        }}
        className="focus:outline-none"
      >
        {({ checked }) =>
          checked ? (
            <FontAwesomeIcon
              icon={faSquareCheck}
              size="xl"
              className={classNames("mr-1", inputClassName)}
              color={color}
            />
          ) : (
            <FontAwesomeIcon
              icon={faSquare}
              size="xl"
              className={classNames("mr-1", inputClassName)}
              color={color}
            />
          )
        }
      </HeadlessCheckbox>
      {errors && <FormError errors={errors} name={label} />}
      <Label className="ml-1 hover:cursor-pointer">
        {children ? children : label}
      </Label>
    </Field>
  );
};

export default Checkbox;
