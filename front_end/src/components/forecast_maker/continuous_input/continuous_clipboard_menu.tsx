import { faCopy, faPaste } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import { ContinuousForecastInputType } from "@/types/charts";
import {
  DistributionQuantileComponent,
  DistributionSliderComponent,
} from "@/types/question";

const CLIPBOARD_MARKER = "_metaculus_distribution";

type ClipboardDistribution = {
  [CLIPBOARD_MARKER]: true;
  type: ContinuousForecastInputType;
  components: DistributionSliderComponent[] | DistributionQuantileComponent;
};

const VALID_INPUT_TYPES: string[] = Object.values(ContinuousForecastInputType);

function isClipboardDistribution(
  data: unknown
): data is ClipboardDistribution {
  return (
    typeof data === "object" &&
    data !== null &&
    CLIPBOARD_MARKER in data &&
    (data as ClipboardDistribution)[CLIPBOARD_MARKER] === true &&
    "type" in data &&
    "components" in data &&
    VALID_INPUT_TYPES.includes((data as ClipboardDistribution).type)
  );
}

type Props = {
  forecastInputMode: ContinuousForecastInputType;
  sliderComponents: DistributionSliderComponent[];
  quantileComponents: DistributionQuantileComponent;
  onPaste: (
    type: ContinuousForecastInputType,
    components: DistributionSliderComponent[] | DistributionQuantileComponent
  ) => void;
  disabled?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
};

const ContinuousClipboardMenu: FC<Props> = ({
  forecastInputMode,
  sliderComponents,
  quantileComponents,
  onPaste,
  disabled,
  containerRef,
}) => {
  const t = useTranslations();

  const onPasteRef = useRef(onPaste);
  onPasteRef.current = onPaste;

  const handleCopy = useCallback(async () => {
    const data: ClipboardDistribution = {
      [CLIPBOARD_MARKER]: true,
      type: forecastInputMode,
      components:
        forecastInputMode === ContinuousForecastInputType.Slider
          ? sliderComponents
          : quantileComponents,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data));
      toast(t("distributionCopied"));
    } catch {
      toast.error(t("distributionCopyFailed"));
    }
  }, [forecastInputMode, sliderComponents, quantileComponents, t]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed: unknown = JSON.parse(text);
      if (!isClipboardDistribution(parsed)) {
        toast.error(t("distributionPasteInvalid"));
        return;
      }
      onPasteRef.current(parsed.type, parsed.components);
      toast(t("distributionPasted"));
    } catch {
      toast.error(t("distributionPasteInvalid"));
    }
  }, [t]);

  // Ctrl+C / Ctrl+V keyboard shortcuts
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      if (e.key === "c") {
        // Only intercept if no text is selected
        const selection = window.getSelection()?.toString();
        if (selection) return;
        e.preventDefault();
        handleCopy();
      } else if (e.key === "v" && !disabled) {
        e.preventDefault();
        handlePaste();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, handleCopy, handlePaste, disabled]);

  return (
    <div className="flex gap-1">
      <Button
        className="size-[26px] border border-blue-400 dark:border-blue-400-dark"
        variant="link"
        onClick={handleCopy}
        aria-label={t("copyDistribution")}
        title={t("copyDistribution")}
      >
        <FontAwesomeIcon
          className="text-blue-700 dark:text-blue-700-dark"
          icon={faCopy}
        />
      </Button>
      {!disabled && (
        <Button
          className="size-[26px] border border-blue-400 dark:border-blue-400-dark"
          variant="link"
          onClick={handlePaste}
          aria-label={t("pasteDistribution")}
          title={t("pasteDistribution")}
        >
          <FontAwesomeIcon
            className="text-blue-700 dark:text-blue-700-dark"
            icon={faPaste}
          />
        </Button>
      )}
    </div>
  );
};

export default ContinuousClipboardMenu;
