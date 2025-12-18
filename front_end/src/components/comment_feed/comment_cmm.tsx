"use client";

import {
  useFloating,
  offset,
  flip,
  useDismiss,
  useRole,
  useInteractions,
  FloatingRootContext,
  useFloatingRootContext,
} from "@floating-ui/react";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, {
  useState,
  forwardRef,
  FC,
  useLayoutEffect,
  useCallback,
} from "react";

import { toggleCMMComment } from "@/app/(main)/questions/actions";
import ForecastTextInput from "@/components/forecast_maker/forecast_text_input";
import Button from "@/components/ui/button";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

export const BINARY_MIN_VALUE = 0.001;
export const BINARY_MAX_VALUE = 0.999;
const clampPrediction = (value: number) =>
  Math.min(Math.max(BINARY_MIN_VALUE * 100, value), BINARY_MAX_VALUE * 100);

const cleanDigitPrediction = (value: number) => Math.floor(10 * value) / 10;

const CmmMakeForecast: FC<{
  updateForecast: (value: number) => Promise<void>;
  initialForecast?: number;
}> = ({ updateForecast, initialForecast }) => {
  initialForecast = cleanDigitPrediction(initialForecast ?? 50);

  const predictionToInputVal = (val: number) => val.toString() + "%";

  const [value, setValue] = useState(predictionToInputVal(initialForecast));
  const [forecast, setForecast] = useState(initialForecast);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations();

  const onForecastChange = (value: number) => {
    setForecast(value);
  };

  const handleInputValueChange = (value: string) => {
    setValue(value);
  };

  let steps = [5, 15];

  if (forecast < 15 || forecast > 85) {
    steps = [1, 5];
  }

  if (forecast < 5 || forecast > 95) {
    steps = [0.1, 1];
  }

  const stepSmall = steps[0];
  const stepBig = steps[1];

  const onClickPredictButton = () => {
    setIsLoading(true);

    updateForecast(forecast / 100).finally(() => {
      setIsLoading(false);
    });
  };

  const onUpdateVal = (step: number | undefined) => {
    if (isNil(step)) {
      logError(new Error("Step is undefined"), {
        message: "Error updating comment forecast",
      });
      return;
    }

    let newPred = clampPrediction(forecast + step);
    newPred = Math.floor(10 * newPred) / 10;
    setValue(predictionToInputVal(newPred));
    setForecast(newPred);
  };

  return (
    <div className="flex flex-col gap-8 sm:flex-row">
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          className="py-1"
          onClick={() => {
            onUpdateVal(!isNil(stepBig) ? -stepBig : undefined);
          }}
        >
          <FontAwesomeIcon icon={faChevronLeft} size="sm" />
          {stepBig}
        </Button>

        <Button
          size="xs"
          className="py-1"
          onClick={() => {
            onUpdateVal(!isNil(stepSmall) ? -stepSmall : undefined);
          }}
        >
          <FontAwesomeIcon icon={faChevronLeft} size="sm" />
          {stepSmall}
        </Button>

        <ForecastTextInput
          value={value}
          minValue={BINARY_MIN_VALUE}
          maxValue={BINARY_MAX_VALUE}
          onChange={handleInputValueChange}
          onForecastChange={onForecastChange}
          isDirty={true}
        />
        <Button
          size="xs"
          className="py-1"
          onClick={() => {
            onUpdateVal(stepSmall);
          }}
        >
          <FontAwesomeIcon icon={faChevronRight} size="sm" />
          {stepSmall}
        </Button>

        <Button
          size="xs"
          className="py-1"
          onClick={() => {
            onUpdateVal(stepBig);
          }}
        >
          <FontAwesomeIcon icon={faChevronRight} size="sm" />
          {stepBig}
        </Button>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={onClickPredictButton}
        disabled={isLoading}
      >
        {t("cmmUpdateButton")}
      </Button>
    </div>
  );
};

type GetProps = <T extends object>(userProps?: T) => T;

interface CmmContext {
  getFloatingProps: GetProps;
  cmmEnabled: boolean;
  onCMMToggled: (a: boolean) => void;
  count: number;
  setFloatingRef: (e: HTMLElement | null) => void;
  setAnchorRef: (e: HTMLElement | null) => void;
  getReferenceProps: GetProps;
  rootContext: FloatingRootContext;
  isOverlayOpen: boolean;
  setIsOverlayOpen: (o: boolean) => void;
}

export const useCmmContext = (
  // isOpen: boolean,
  // setIsOpen: (open: boolean) => void,
  initialCount: number,
  initialCmmEnabled: boolean
): CmmContext => {
  const [anchorRef, setAnchorRef] = useState<HTMLElement | null>(null);
  const [floatingRef, setFloatingRef] = useState<HTMLElement | null>(null);

  const [cmmState, setCmmState] = useState({
    count: initialCount,
    isCmmEnabled: initialCmmEnabled,
    isModalOpen: false,
  });

  const setIsOverlayOpen = (open: boolean) =>
    setCmmState({ ...cmmState, isModalOpen: open });

  const rootContext = useFloatingRootContext({
    open: cmmState.isModalOpen,
    onOpenChange: setIsOverlayOpen,

    elements: {
      reference: anchorRef,
      floating: floatingRef,
    },
  });

  const dismiss = useDismiss(rootContext);
  const role = useRole(rootContext);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ]);

  const onCMMToggled = (enabled: boolean) => {
    const countInc = cmmState.isCmmEnabled == enabled ? 0 : enabled ? 1 : -1;
    setCmmState({
      ...cmmState,
      isCmmEnabled: enabled,
      count: cmmState.count + countInc,
      isModalOpen:
        !cmmState.isModalOpen &&
        !cmmState.isCmmEnabled &&
        cmmState.isCmmEnabled != enabled,
    });
  };

  return {
    getFloatingProps: getFloatingProps as GetProps,
    cmmEnabled: cmmState.isCmmEnabled,
    onCMMToggled,
    count: cmmState.count,
    setFloatingRef,
    setAnchorRef,
    getReferenceProps: getReferenceProps as GetProps,
    rootContext,
    isOverlayOpen: cmmState.isModalOpen,
    setIsOverlayOpen,
  };
};

interface CmmOverlayProps {
  showForecastingUI: boolean;
  forecast?: number;
  updateForecast?: (value: number) => Promise<void>;
  onClickScrollLink: () => void;
  cmmContext: CmmContext;
}

const CmmOverlay = ({
  forecast,
  updateForecast,
  onClickScrollLink,
  showForecastingUI,
  cmmContext,
}: CmmOverlayProps) => {
  const t = useTranslations();
  const { floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [
      offset(10), // Adjust offset as needed
      flip(),
    ],
    rootContext: cmmContext.rootContext,
  });

  return (
    cmmContext.isOverlayOpen && (
      <div
        ref={cmmContext.setFloatingRef}
        style={floatingStyles}
        {...cmmContext.getFloatingProps()}
        className="z-50 rounded bg-white p-4 text-sm text-blue-900 shadow-xl dark:bg-gray-0-dark dark:text-blue-900-dark"
      >
        <h3 className="my-2 mb-4 w-full text-center">
          {t("updateYourPrediction")}
        </h3>
        <div className="flex flex-col gap-2">
          {forecast && showForecastingUI && updateForecast && (
            <CmmMakeForecast
              updateForecast={(value) => {
                return updateForecast(value).finally(() => {
                  cmmContext.setIsOverlayOpen(false);
                });
              }}
              initialForecast={forecast}
            />
          )}
          <Button variant="link" onClick={onClickScrollLink}>
            {t("cmmUpdatePredictionLink")}
          </Button>
        </div>
      </div>
    )
  );
};

type LabelVariant = "full" | "mid" | "tiny";

function useFittingLabel<
  TContainer extends HTMLElement,
  TFull extends HTMLElement,
  TMid extends HTMLElement,
  TTiny extends HTMLElement,
>(params: {
  containerRef: React.RefObject<TContainer | null>;
  fullRef: React.RefObject<TFull | null>;
  midRef: React.RefObject<TMid | null>;
  tinyRef: React.RefObject<TTiny | null>;
}) {
  const [variant, setVariant] = useState<LabelVariant>("full");

  const recompute = useCallback(() => {
    const container = params.containerRef.current;
    if (!container) return;

    const available = container.clientWidth;
    const wFull = params.fullRef.current?.offsetWidth ?? 0;
    const wMid = params.midRef.current?.offsetWidth ?? 0;

    const next =
      wFull <= available ? "full" : wMid <= available ? "mid" : "tiny";

    setVariant((prev) => (prev === next ? prev : next));
  }, [params.containerRef, params.fullRef, params.midRef]);

  useLayoutEffect(() => {
    recompute();
    const el = params.containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recompute, params.containerRef]);

  return variant;
}

interface CmmToggleButtonProps {
  comment_id: number;
  disabled?: boolean;
  cmmContext: CmmContext;
}

const CmmToggleButton = forwardRef<HTMLButtonElement, CmmToggleButtonProps>(
  ({ comment_id, disabled, cmmContext }, ref) => {
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(false);

    const onChangedMyMind = async () => {
      try {
        setIsLoading(true);
        await toggleCMMComment({
          id: comment_id,
          enabled: !cmmContext.cmmEnabled,
        });
        cmmContext.onCMMToggled(!cmmContext.cmmEnabled);
        sendAnalyticsEvent("commentChangedMind");
      } catch (e) {
        logError(e);
        cmmContext.onCMMToggled(cmmContext.cmmEnabled);
      } finally {
        setIsLoading(false);
      }
    };

    const isDisabled = isLoading || !!disabled;

    const count = cmmContext.count;

    const fullLabel = `${t("cmmButton")} (${count})`;
    const midLabel = `${t("cmmButtonShort")} (${count})`;
    const tinyLabel = `(${count})`;

    const labelBoxRef = React.useRef<HTMLSpanElement>(null);
    const fullMeasureRef = React.useRef<HTMLSpanElement>(null);
    const midMeasureRef = React.useRef<HTMLSpanElement>(null);
    const tinyMeasureRef = React.useRef<HTMLSpanElement>(null);

    const variant = useFittingLabel({
      containerRef: labelBoxRef,
      fullRef: fullMeasureRef,
      midRef: midMeasureRef,
      tinyRef: tinyMeasureRef,
    });

    return (
      <Button
        size="xxs"
        variant="tertiary"
        onClick={onChangedMyMind}
        aria-label={t("cmmButton")}
        disabled={isDisabled}
        ref={ref}
        {...cmmContext.getReferenceProps()}
        className={cn(
          "group relative inline-flex min-w-0 items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-1 text-sm font-normal leading-[16px] tracking-tight transition-colors disabled:cursor-not-allowed",
          !isDisabled &&
            (cmmContext.cmmEnabled
              ? "hover:bg-olive-50 dark:hover:bg-olive-400/10"
              : "hover:bg-blue-50 dark:hover:bg-blue-600/20"),
          isDisabled &&
            "border-gray-300 bg-gray-100 text-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500"
        )}
      >
        <DeltaBadge enabled={cmmContext.cmmEnabled} disabled={isDisabled} />

        <span
          ref={labelBoxRef}
          className={cn(
            "min-w-0 flex-1 overflow-hidden whitespace-nowrap",
            "text-blue-700 dark:text-blue-700-dark",
            isDisabled && "text-current"
          )}
        >
          {variant === "full"
            ? fullLabel
            : variant === "mid"
              ? midLabel
              : tinyLabel}
        </span>

        <span className="pointer-events-none absolute -z-10 opacity-0">
          <span ref={fullMeasureRef} className="whitespace-nowrap">
            {fullLabel}
          </span>
          <span ref={midMeasureRef} className="whitespace-nowrap">
            {midLabel}
          </span>
          <span ref={tinyMeasureRef} className="whitespace-nowrap">
            {tinyLabel}
          </span>
        </span>
      </Button>
      // <button
      //   onClick={onChangedMyMind}
      //   aria-label="Changed my mind"
      //   className="inline-flex items-center justify-center rounded-full disabled:opacity-50 hover:bg-metac-gray-100 dark:hover:bg-metac-gray-100-dark whitespace-nowrap gap-0 border rounded-sm border-blue-400 dark:border-blue-600/50 pl-0.5 pr-2"
      //   disabled={isLoading || disabled}
      //   ref={ref}
      //   {...cmmContext.getReferenceProps()}
      // >
      //   <FontAwesomeIcon
      //     icon={faCaretUp}
      //     className={cn(
      //       "size-4 rounded-full",
      //       {
      //         "bg-gradient-to-b p-1 text-blue-700 group-hover:from-blue-400 group-hover:to-blue-100 dark:text-blue-700-dark dark:group-hover:from-blue-400-dark dark:group-hover:to-blue-100-dark":
      //           !cmmContext.cmmEnabled,
      //       },
      //       {
      //         "bg-gradient-to-b from-olive-400 to-blue-100 p-1 text-olive-700 group-hover:from-olive-500 group-hover:to-blue-100 dark:from-olive-300-dark dark:to-blue-100-dark dark:text-olive-700-dark dark:group-hover:from-olive-500-dark dark:group-hover:to-blue-100-dark":
      //           cmmContext.cmmEnabled,
      //       }
      //     )}
      //   />

      //   <span className="text-blue-700 dark:text-blue-700-dark">
      //     {t("cmmButton")} ({cmmContext.count})
      //   </span>
      // </button>
    );
  }
);

const DeltaBadge: FC<{ enabled: boolean; disabled?: boolean }> = ({
  enabled,
  disabled,
}) => {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 items-center justify-center rounded-full font-semibold leading-none",
        "text-[12px] transition-colors",
        disabled && "opacity-60",
        !enabled && "bg-transparent text-blue-700 dark:text-blue-700-dark",
        enabled &&
          "bg-gradient-to-b from-olive-400 to-blue-100 p-1 text-olive-700 dark:from-olive-300-dark dark:to-blue-100-dark dark:text-olive-700-dark"
      )}
    >
      ∆
    </span>
  );
};

CmmToggleButton.displayName = "CmmToggleButton";

export { CmmToggleButton, CmmOverlay };
