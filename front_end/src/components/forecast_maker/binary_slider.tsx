import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { SemanticName } from "rc-slider/lib/interface";
import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
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
    const markRect = communityBubbleRef.current.getBoundingClientRect();

    // Calculate slider handle position (approximate based on slider value)
    const sliderProgress =
      (sliderValue - BINARY_MIN_VALUE) / (BINARY_MAX_VALUE - BINARY_MIN_VALUE);
    const handleX = sliderRect.left + sliderRect.width * sliderProgress;

    // Calculate community bubble center position
    const bubbleX = markRect.left + markRect.width / 2;

    // Check if they're too close (considering handle width and bubble width)
    const handleWidth = 20;
    const distance = Math.abs(handleX - bubbleX);
    const minDistance = handleWidth / 2 + markRect.width / 2 + COLLISION_BUFFER;

    setIsNearCommunityForecast(distance < minDistance);
  }, [sliderValue, communityForecast]);

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
  { value: number; isNear: boolean; disabled: boolean }
>(({ value, isNear, disabled }, ref) => {
  const t = useTranslations();
  return (
    <div
      ref={ref}
      className={cn("absolute -translate-x-1/2", {
        "translate-y-[-36px]": isNear,
        "translate-y-[-20px]": !isNear,
      })}
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
      <Rectangle
        className={cn(
          "mx-auto -mt-[1px] fill-olive-800 dark:fill-olive-800-dark",
          {
            "fill-gray-700 dark:fill-gray-700-dark": disabled,
          }
        )}
      />
    </div>
  );
});

MarkArrow.displayName = "MarkArrow";

export default BinarySlider;
