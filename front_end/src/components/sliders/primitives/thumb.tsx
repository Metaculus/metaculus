import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { flushSync } from "react-dom";

import { FORECAST_INPUT_REGEX } from "@/components/forecast_maker/forecast_text_input";
import cn from "@/utils/core/cn";

const TAP_MOVE_THRESHOLD_PX = 6;
const TOUCH_MOVE_THRESHOLD_PX = 10;

type Props = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  active: boolean;
  value: number;
  showValue?: boolean;
  onClickIn?: (shiftKey: boolean) => void;
  onArrowClickIn?: () => void;
  onArrowClickOut?: (direction: -1 | 1) => void;
  className?: string;
  arrowClassName?: string;
  editable?: boolean;
  isEditing?: boolean;
  draftValue?: string;
  onRequestEdit?: () => void;
  onDraftChange?: (value: string) => void;
  onCommit?: () => void;
  onCancel?: () => void;
  editAriaLabel?: string;
};

const SliderThumb: FC<Props> = ({
  active,
  value,
  showValue = false,
  className,
  onClickIn,
  onArrowClickIn,
  onArrowClickOut,
  arrowClassName,
  editable = false,
  isEditing = false,
  draftValue = "",
  onRequestEdit,
  onDraftChange,
  onCommit,
  onCancel,
  editAriaLabel,
  ...props
}) => {
  // Track whether the press turned into a drag. We let the browser do the
  // click-vs-drag disambiguation (it only fires `click` on a press-release that
  // didn't drag), and use this flag to ignore the rare click some browsers emit
  // after a small drag. rc-slider keeps owning the actual drag.
  const movedRef = useRef(false);
  const detachRef = useRef<(() => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tear down any dangling document listener if the thumb unmounts mid-press.
  useEffect(() => () => detachRef.current?.(), []);

  // The decimal keypad has no return key, so commit normally only happens on
  // blur — but dismissing the iOS keyboard doesn't reliably blur the input.
  // Watch the visual viewport and blur once the keyboard closes (which fires
  // onBlur -> onCommit -> the thumb moves), so no extra tap is needed.
  useEffect(() => {
    if (!isEditing) return;
    const vv = window.visualViewport;
    if (!vv) return;
    let keyboardOpened = false;
    const onResize = () => {
      const occluded = window.innerHeight - vv.height;
      if (occluded > 120) keyboardOpened = true;
      else if (keyboardOpened) inputRef.current?.blur();
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, [isEditing]);

  const handlePressStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      movedRef.current = false;
      const startX = e.clientX;
      const startY = e.clientY;
      const threshold =
        e.pointerType === "touch"
          ? TOUCH_MOVE_THRESHOLD_PX
          : TAP_MOVE_THRESHOLD_PX;

      const onMove = (ev: PointerEvent) => {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > threshold) {
          movedRef.current = true;
        }
      };
      const detach = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", detach);
        document.removeEventListener("pointercancel", detach);
        detachRef.current = null;
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", detach);
      document.addEventListener("pointercancel", detach);
      detachRef.current = detach;
    },
    []
  );

  // Mount the input synchronously, then focus it within the same gesture. iOS
  // only raises the keyboard for a focus() call made directly inside a user
  // gesture handler, so we can't rely on autoFocus after an async re-render.
  const openAndFocus = useCallback(() => {
    if (movedRef.current) return;
    flushSync(() => onRequestEdit?.());
    inputRef.current?.focus();
  }, [onRequestEdit]);

  // Mouse opens on `click` (the browser's own click-vs-drag disambiguation).
  // Touch/pen open on `pointerup`: a single tap should work, but iOS suppresses
  // the first `click` once the thumb enters its :hover state, so it would
  // otherwise need a second tap.
  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") openAndFocus();
    },
    [openAndFocus]
  );

  return (
    <div
      {...props}
      className={cn(
        "absolute flex cursor-pointer touch-none items-center focus:outline-none",
        active ? "z-10" : "z-0",
        className
      )}
    >
      {!!onArrowClickIn && !!onArrowClickOut && (
        <ArrowButton
          direction="left"
          onClickIn={onArrowClickIn}
          onClickOut={() => onArrowClickOut(-1)}
          className={arrowClassName}
        />
      )}
      <div
        onMouseDown={(e) => {
          if (isEditing) return;
          e.preventDefault();
          onClickIn?.(e.shiftKey);
        }}
        onTouchStart={(e) => {
          if (isEditing) return;
          // Always preventDefault, even when editable: it suppresses the
          // simulated mouse events that would otherwise hit rc-slider's
          // track-click handler (`onSliderMouseDown`) and move/arm-drag the
          // slider during a later scroll. Touch opens the editor via
          // onPointerUp (which still fires), so the synthetic click isn't needed.
          e.preventDefault();
          onClickIn?.(e.shiftKey);
        }}
        onPointerDown={editable && !isEditing ? handlePressStart : undefined}
        onPointerUp={editable && !isEditing ? handlePointerUp : undefined}
        onClick={editable && !isEditing ? openAndFocus : undefined}
        className={cn(
          "group/thumb flex items-center border-2 border-gray-600 bg-blue-100 text-center font-medium dark:border-gray-600-dark dark:bg-blue-100-dark",
          "active:bg-blue-400 active:dark:bg-blue-400-dark",
          active ? "size-5 text-center" : "size-4 rounded-full",
          { "h-8 w-14 rounded-full": showValue }
        )}
      >
        {showValue &&
          (isEditing ? (
            <input
              ref={inputRef}
              autoFocus
              type="text"
              inputMode="decimal"
              aria-label={editAriaLabel}
              value={draftValue}
              // 16px font-size keeps iOS from auto-zooming on focus; scale it
              // back down so it still renders at the 14px (text-sm) visual size.
              // appearance-none removes the native iOS input chrome (solid bg /
              // sharp corners) that would otherwise show inside the rounded pill.
              className="mx-auto w-full scale-[0.875] appearance-none bg-transparent text-center text-base outline-none"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                // Localized decimal keypads emit "," — treat it as ".".
                const v = e.target.value.replace(",", ".");
                if (!FORECAST_INPUT_REGEX.test(v)) return;
                onDraftChange?.(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCommit?.();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  onCancel?.();
                }
                e.stopPropagation();
              }}
              onBlur={() => onCommit?.()}
            />
          ) : (
            <span
              className={cn(
                "mx-auto select-none text-center text-sm",
                editable &&
                  "decoration-blue-700 underline-offset-2 dark:decoration-blue-500 [@media(hover:hover)]:group-hover/thumb:underline"
              )}
            >
              {value}%
            </span>
          ))}
      </div>
      {!!onArrowClickIn && !!onArrowClickOut && (
        <ArrowButton
          direction="right"
          onClickIn={onArrowClickIn}
          onClickOut={() => onArrowClickOut(1)}
          className={arrowClassName}
        />
      )}
    </div>
  );
};

type ArrowButtonProps = {
  direction: "left" | "right";
  onClickIn: () => void;
  onClickOut: () => void;
  className?: string;
};
const ArrowButton: FC<ArrowButtonProps> = ({
  direction,
  onClickIn,
  onClickOut,
  className,
}) => (
  <button
    className={cn(
      "invisible flex items-center rounded-full bg-blue-200 px-1.5 py-1 text-center text-gray-500 hover:text-gray-700 active:text-blue-800 group-hover:visible dark:bg-blue-800 dark:hover:text-gray-300 dark:active:text-blue-200",
      className
    )}
    onMouseDown={(e) => {
      e.stopPropagation();
      onClickIn();
    }}
    onMouseUp={onClickOut}
    onTouchStart={(e) => {
      e.stopPropagation();
      onClickIn();
    }}
    onTouchEnd={onClickOut}
  >
    <FontAwesomeIcon
      icon={direction === "right" ? faPlus : faMinus}
      size="lg"
    />
  </button>
);

export default SliderThumb;
