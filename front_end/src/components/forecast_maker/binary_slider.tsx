import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { SemanticName } from "rc-slider/lib/interface";
import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Rectangle } from "@/components/icons/rectangle";
import Slider from "@/components/sliders/slider";
import cn from "@/utils/core/cn";

const DEFAULT_SLIDER_VALUE = 50;
export const BINARY_FORECAST_PRECISION = 3;
export const BINARY_MIN_VALUE = 10 ** -BINARY_FORECAST_PRECISION * 100;
export const BINARY_MAX_VALUE = 100 - BINARY_MIN_VALUE;
const COLLISION_BUFFER = 10; // pixels
const EDGE_PADDING = 14;

type Props = {
  forecast: number | null;
  onChange: (forecast: number) => void;
  isDirty: boolean;
  onBecomeDirty?: () => void;
  communityForecast?: number | null;
  disabled?: boolean;
  helperDisplay?: boolean;
  className?: string;
  styles?: Partial<Record<SemanticName, CSSProperties>>;
  withArrowStep?: boolean;
};

const BinarySlider: FC<Props> = ({
  onChange,
  forecast,
  communityForecast,
  onBecomeDirty,
  disabled = false,
  helperDisplay = false,
  className,
  styles,
  withArrowStep = true,
}) => {
  const inputDisplayValue = forecast ? forecast.toString() + "%" : "—";
  const [, setInputValue] = useState(inputDisplayValue);
  const [isInputFocused] = useState(false);
  const [markShiftX, setMarkShiftX] = useState(0);
  const [sliderValue, setSliderValue] = useState(
    forecast ?? DEFAULT_SLIDER_VALUE
  );
  const [isNearCommunityForecast, setIsNearCommunityForecast] = useState(false);

  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const communityBubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isInputFocused) {
      setInputValue(inputDisplayValue);
    }
  }, [inputDisplayValue, isInputFocused]);

  useLayoutEffect(() => {
    if (
      !communityForecast ||
      !sliderContainerRef.current ||
      !communityBubbleRef.current
    ) {
      setMarkShiftX(0);
      return;
    }
    const sliderEl = sliderContainerRef.current;
    const bubbleEl = communityBubbleRef.current;

    const measureAndClamp = () => {
      const sliderRect = sliderEl.getBoundingClientRect();
      const bubbleWidth = bubbleEl.offsetWidth;
      const markValue = communityForecast * 100;
      const ratio =
        (markValue - BINARY_MIN_VALUE) / (BINARY_MAX_VALUE - BINARY_MIN_VALUE);

      const idealCenterX = sliderRect.left + sliderRect.width * ratio;
      const idealLeft = idealCenterX - bubbleWidth / 2;
      const idealRight = idealCenterX + bubbleWidth / 2;

      const clampLeft = sliderRect.left - EDGE_PADDING;
      const clampRight = sliderRect.right + EDGE_PADDING;

      let shift = 0;
      if (idealLeft < clampLeft) {
        shift = clampLeft - idealLeft;
      } else if (idealRight > clampRight) {
        shift = clampRight - idealRight;
      }

      setMarkShiftX(shift);
    };

    measureAndClamp();
    const ro = new ResizeObserver(measureAndClamp);
    ro.observe(sliderEl);
    window.addEventListener("resize", measureAndClamp);
    window.addEventListener("scroll", measureAndClamp, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureAndClamp);
      window.removeEventListener("scroll", measureAndClamp, true);
    };
  }, [communityForecast]);

  // Calculate physical collision between slider handle and community bubble
  useEffect(() => {
    if (
      !communityForecast ||
      !sliderContainerRef.current ||
      !communityBubbleRef.current
    ) {
      setIsNearCommunityForecast(false);
      return;
    }

    const sliderRect = sliderContainerRef.current.getBoundingClientRect();
    const bubbleWidth = communityBubbleRef.current.offsetWidth;

    const markValue = communityForecast * 100;
    const ratio =
      (markValue - BINARY_MIN_VALUE) / (BINARY_MAX_VALUE - BINARY_MIN_VALUE);

    const idealCenterX = sliderRect.left + sliderRect.width * ratio;
    const bubbleCenterX = idealCenterX + markShiftX;

    // Calculate slider handle position (approximate based on slider value)
    const sliderProgress =
      (sliderValue - BINARY_MIN_VALUE) / (BINARY_MAX_VALUE - BINARY_MIN_VALUE);
    const handleX = sliderRect.left + sliderRect.width * sliderProgress;

    // Check if they're too close (considering handle width and bubble width)
    const handleWidth = 20;
    const distance = Math.abs(handleX - bubbleCenterX);
    const minDistance = handleWidth / 2 + bubbleWidth / 2 + COLLISION_BUFFER;

    setIsNearCommunityForecast((prev) => {
      if (!prev && distance < minDistance) return true;
      if (prev && distance > minDistance) return false;
      return prev;
    });
  }, [sliderValue, communityForecast, markShiftX]);

  const handleSliderForecastChange = useCallback(
    (value: number) => {
      setInputValue(value.toString() + "%");
      setSliderValue(value);
      onBecomeDirty?.();
      onChange(value);
    },
    [onBecomeDirty, onChange]
  );

  return (
    <>
      <div
        className={cn("group relative mt-9 py-5", className)}
        ref={sliderContainerRef}
      >
        <Slider
          inputMin={BINARY_MIN_VALUE}
          inputMax={BINARY_MAX_VALUE}
          defaultValue={forecast ?? DEFAULT_SLIDER_VALUE}
          onChange={handleSliderForecastChange}
          step={1}
          arrowStep={withArrowStep ? 0.1 : undefined}
          shouldSyncWithDefault
          marks={
            communityForecast
              ? {
                  // Pass the isNear prop
                  [communityForecast * 100]: (
                    <MarkArrow
                      value={communityForecast}
                      isNear={isNearCommunityForecast}
                      disabled={disabled}
                      ref={communityBubbleRef}
                      shiftX={markShiftX}
                    />
                  ),
                }
              : undefined
          }
          disabled={disabled}
          styles={disabled ? { handle: { cursor: "default" } } : styles}
          showValue
        />
        {forecast !== null && helperDisplay && (
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: `${((forecast - BINARY_MIN_VALUE) / (BINARY_MAX_VALUE - BINARY_MIN_VALUE)) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-full self-center text-center text-orange-700/50 dark:text-orange-300/50">
              <FontAwesomeIcon icon={faChevronUp} />
            </div>
            <span className="mt-[-4px] block text-orange-700 dark:text-orange-300">
              Me
            </span>
          </div>
        )}
      </div>
    </>
  );
};

const MarkArrow = React.forwardRef<
  HTMLDivElement,
  { value: number; isNear: boolean; disabled: boolean; shiftX?: number }
>(({ value, isNear, disabled, shiftX = 0 }, ref) => {
  const t = useTranslations();
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute"
      style={{
        transform: `translate(calc(-50% + ${shiftX}px), ${isNear ? "-36px" : "-20px"})`,
        willChange: "transform",
      }}
    >
      <div
        className={cn(
          "whitespace-nowrap rounded-full bg-olive-800 px-2 py-1 text-xs font-medium capitalize text-olive-100 transition-transform duration-150 dark:bg-olive-800-dark dark:text-olive-100-dark",
          {
            "bg-gray-700 dark:bg-gray-700-dark": disabled,
          }
        )}
      >
        {t("community")}:{" "}
        <span className="font-bold">{`${Math.round(1000 * value) / 10}%`}</span>
      </div>
      <div style={{ transform: `translateX(${-shiftX}px)` }}>
        <Rectangle
          className={cn(
            "mx-auto -mt-[1px] fill-olive-800 dark:fill-olive-800-dark",
            {
              "fill-gray-700 dark:fill-gray-700-dark": disabled,
            }
          )}
        />
      </div>
    </div>
  );
});

MarkArrow.displayName = "MarkArrow";

export default BinarySlider;
