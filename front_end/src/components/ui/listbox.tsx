import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Portal,
} from "@headlessui/react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Button, { ButtonVariant } from "@/components/ui/button";
import cn from "@/utils/core/cn";

export type SelectOption<T> = {
  value: T;
  label: string;
  className?: string;
};

type SingleSelectProps<T> = {
  multiple?: false;
  value: T;
  onChange: (option: T) => void;
};
type MultiSelectProps<T> = {
  multiple: true;
  value: T[];
  onChange: (options: T[]) => void;
};

type Props<T> = {
  options: SelectOption<T>[];
  onClick?: (value: string) => void;
  buttonVariant?: ButtonVariant;
  arrowPosition?: "left" | "right";
  menuPosition?: "left" | "right";
  label?: string;
  className?: string;
  optionsClassName?: string;
  disabled?: boolean;
  renderInPortal?: boolean;
  preventParentScroll?: boolean;
  menuMinWidthMatchesButton?: boolean;
  onOpenChange?: (open: boolean) => void;
} & (SingleSelectProps<T> | MultiSelectProps<T>);

const Listbox = <T extends string>(props: Props<T>) => {
  const {
    options,
    onClick,
    buttonVariant = "text",
    arrowPosition = "left",
    menuPosition = "right",
    label,
    className,
    disabled,
    optionsClassName,
    renderInPortal = false,
    preventParentScroll = false,
    menuMinWidthMatchesButton = true,
  } = props;

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const activeLabel = useMemo(() => {
    if (isMulti(props)) return "Select options";
    const v = isSingle(props) ? props.value : undefined;
    return options.find((o) => o.value === v)?.label ?? "";
  }, [options, props]);

  const handleChange = (value: T | T[]) => {
    if (isMulti(props)) props.onChange(value as T[]);
    else (props as SingleSelectProps<T>).onChange(value as T);
  };

  return (
    <HeadlessListbox
      as="div"
      value={
        isMulti(props)
          ? (props.value as T[])
          : (props as SingleSelectProps<T>).value
      }
      onChange={handleChange}
      multiple={isMulti(props)}
      className="relative text-gray-900 dark:text-gray-900-dark"
      disabled={disabled}
    >
      {({ open }) => (
        <>
          <OpenStateReporter open={open} onOpenChange={props.onOpenChange} />
          <ListboxButton
            as={Button}
            ref={buttonRef}
            variant={buttonVariant}
            className={cn(className, {
              "flex-row-reverse": arrowPosition === "right",
            })}
          >
            <FontAwesomeIcon icon={faChevronDown} />
            <span className="align-middle">{label ?? activeLabel}</span>
          </ListboxButton>

          {!renderInPortal && (
            <ListboxOptions
              className={cn(
                "absolute top-10 z-100 divide-y divide-gray-300 rounded border border-gray-300 bg-gray-0 shadow-lg outline-none dark:divide-gray-300-dark dark:border-gray-300-dark dark:bg-gray-0-dark",
                {
                  "right-0": menuPosition === "right",
                  "left-0": menuPosition === "left",
                },
                optionsClassName
              )}
            >
              {options.map((option) => (
                <ListboxOption
                  as={Fragment}
                  key={option.value}
                  value={option.value}
                >
                  {({ focus, selected }) => (
                    <button
                      className={cn(
                        "flex h-10 w-full items-center justify-end gap-1 whitespace-nowrap px-3 text-right text-sm",
                        {
                          "bg-gray-200 dark:bg-gray-200-dark": focus,
                          "font-bold": selected,
                        },
                        option.className
                      )}
                      onClick={() => onClick && onClick(option.label)}
                    >
                      {isMulti(props) && selected && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-blue-600"
                        />
                      )}
                      {option.label}
                    </button>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          )}

          {renderInPortal && (
            <FloatingMenu<T>
              open={open}
              renderInPortal
              preventParentScroll={preventParentScroll}
              menuMinWidthMatchesButton={menuMinWidthMatchesButton}
              optionsClassName={optionsClassName}
              buttonRef={buttonRef}
              options={options}
              onClick={onClick}
              multiple={isMulti(props)}
            />
          )}
        </>
      )}
    </HeadlessListbox>
  );
};

function isMulti<T>(p: Props<T>): p is Props<T> & MultiSelectProps<T> {
  return (p as { multiple?: boolean }).multiple === true;
}

function isSingle<T>(p: Props<T>): p is Props<T> & SingleSelectProps<T> {
  return !isMulti(p);
}

type FloatingMenuProps<T> = {
  open: boolean;
  renderInPortal: boolean;
  preventParentScroll: boolean;
  menuMinWidthMatchesButton: boolean;
  optionsClassName?: string;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  options: SelectOption<T>[];
  onClick?: (value: string) => void;
  multiple: boolean;
};

function FloatingMenu<T extends string>({
  open,
  renderInPortal,
  preventParentScroll,
  menuMinWidthMatchesButton,
  optionsClassName,
  buttonRef,
  options,
  onClick,
  multiple,
}: FloatingMenuProps<T>) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [flipUp, setFlipUp] = useState(false);

  const updateRect = useCallback(() => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    setRect(r);
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    setFlipUp(spaceBelow < 260 && spaceAbove > spaceBelow);
  }, [buttonRef]);

  useEffect(() => {
    if (!renderInPortal || !open) return;
    updateRect();
    const onResizeOrScroll = () => updateRect();
    window.addEventListener("resize", onResizeOrScroll, { passive: true });
    window.addEventListener("scroll", onResizeOrScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll);
    };
  }, [open, renderInPortal, updateRect]);

  const menu = (
    <ListboxOptions
      className={cn(
        "divide-y divide-gray-300 rounded border border-gray-300 bg-gray-0 shadow-lg outline-none dark:divide-gray-300-dark dark:border-gray-300-dark dark:bg-gray-0-dark",
        optionsClassName
      )}
      style={
        !renderInPortal
          ? undefined
          : {
              position: "fixed",
              left: rect?.left,
              top: !flipUp ? rect?.bottom : undefined,
              bottom: flipUp
                ? window.innerHeight - (rect?.top ?? 0)
                : undefined,
              minWidth: menuMinWidthMatchesButton ? rect?.width : undefined,
              maxWidth: "min(420px, 100vw - 16px)",
              overflowY: "auto",
              zIndex: 10000,
            }
      }
      onWheelCapture={(e) => {
        if (renderInPortal && preventParentScroll) e.stopPropagation();
      }}
      onTouchMoveCapture={(e) => {
        if (renderInPortal && preventParentScroll) e.stopPropagation();
      }}
    >
      {options.map((option) => (
        <ListboxOption as={Fragment} key={option.value} value={option.value}>
          {({ focus, selected }) => (
            <button
              className={cn(
                "flex h-10 w-full items-center justify-end gap-1 whitespace-nowrap px-3 text-right text-sm",
                {
                  "bg-gray-200 dark:bg-gray-200-dark": focus,
                  "font-bold": selected,
                },
                option.className
              )}
              onClick={() => onClick && onClick(option.label)}
            >
              {multiple && selected && (
                <FontAwesomeIcon icon={faCheck} className="text-blue-600" />
              )}
              {option.label}
            </button>
          )}
        </ListboxOption>
      ))}
    </ListboxOptions>
  );

  if (!renderInPortal) return menu;
  if (!open || !rect) return null;
  return <Portal>{menu}</Portal>;
}

function OpenStateReporter({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return null;
}

export default Listbox;
