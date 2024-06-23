import { faSquare, faSquareCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Checkbox as HeadlessCheckbox, Field, Label } from "@headlessui/react";
import classNames from "classnames";
import { FC, MouseEventHandler, TouchEventHandler } from "react";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  inputClassName?: string;
  className?: string;
  color?: string;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onTouchStart?: TouchEventHandler<HTMLDivElement>;
  onTouchMove?: TouchEventHandler<HTMLDivElement>;
};

const Checkbox: FC<Props> = ({
  checked,
  onChange,
  label,
  inputClassName,
  className,
  color,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
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
        onChange={onChange}
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
      <Label className="hover:cursor-pointer">{label}</Label>
    </Field>
  );
};

export default Checkbox;
