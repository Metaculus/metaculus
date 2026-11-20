import {
  faCircleQuestion,
  faCopy,
  faGear,
  faPaste,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import Button from "@/components/ui/button";
import Switch from "@/components/ui/switch";
import Tooltip from "@/components/ui/tooltip";

type Props = {
  graph: {
    // "PDF" or "PMF"
    densityLabel: string;
    isCdf: boolean;
    onChange: (isCdf: boolean) => void;
    description: string;
  };
  // The rows below are only shown when provided
  overlayPrevious?: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
  };
  clipboard?: { copy: () => void; paste?: () => void };
  // Group questions: copy this forecast to/from other subquestions
  subquestionCopyMenu?: ReactNode;
};

/**
 * Options for the continuous input, behind a single gear button so the
 * header stays uncluttered. Each option gets its own labeled row.
 */
const ContinuousInputOptions: FC<Props> = ({
  graph,
  overlayPrevious,
  clipboard,
  subquestionCopyMenu,
}) => {
  const t = useTranslations();

  return (
    <Popover>
      <PopoverButton
        className="flex size-[26px] items-center justify-center rounded-full border border-blue-400 text-blue-700 hover:bg-blue-100 data-[open]:bg-blue-200 dark:border-blue-400-dark dark:text-blue-700-dark dark:hover:bg-blue-100-dark dark:data-[open]:bg-blue-200-dark"
        aria-label={t("forecastInputSettings")}
        title={t("forecastInputSettings")}
      >
        <FontAwesomeIcon icon={faGear} />
      </PopoverButton>
      <PopoverPanel
        anchor={{ to: "bottom end", gap: 6 }}
        className="z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col divide-y divide-gray-300 rounded border border-gray-300 bg-gray-0 px-4 py-1 text-gray-800 shadow-lg shadow-[#0003] dark:divide-gray-300-dark dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-800-dark"
      >
        <OptionRow label={t("graph")} description={graph.description}>
          <div className="flex items-center gap-2 text-sm">
            <span className={graph.isCdf ? "opacity-60" : "opacity-90"}>
              {graph.densityLabel}
            </span>
            <Switch
              checked={graph.isCdf}
              onChange={graph.onChange}
              aria-label={t("graph")}
            />
            <span className={graph.isCdf ? "opacity-90" : "opacity-60"}>
              {t("cdf")}
            </span>
          </div>
        </OptionRow>

        {overlayPrevious && (
          <OptionRow label={overlayPrevious.label}>
            <Switch
              checked={overlayPrevious.checked}
              onChange={overlayPrevious.onChange}
              aria-label={overlayPrevious.label}
            />
          </OptionRow>
        )}

        {clipboard && (
          <OptionRow
            label={t("distributionClipboard")}
            description={t("distributionClipboardDescription")}
          >
            <div className="flex gap-2">
              <ClipboardButton
                icon={faCopy}
                label={t("copy")}
                title={t("copyDistribution")}
                onClick={clipboard.copy}
              />
              {clipboard.paste && (
                <ClipboardButton
                  icon={faPaste}
                  label={t("paste")}
                  title={t("pasteDistribution")}
                  onClick={clipboard.paste}
                />
              )}
            </div>
          </OptionRow>
        )}

        {subquestionCopyMenu && (
          <OptionRow
            label={t("otherSubquestions")}
            description={t("otherSubquestionsDescription")}
          >
            <div className="size-[26px] rounded-full bg-gray-100 dark:bg-gray-100-dark">
              {subquestionCopyMenu}
            </div>
          </OptionRow>
        )}
      </PopoverPanel>
    </Popover>
  );
};

const OptionRow: FC<{
  label: string;
  // Help text, shown in a tooltip next to the label
  description?: string;
  children: ReactNode;
}> = ({ label, description, children }) => (
  <div className="flex items-center justify-between gap-3 py-3">
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <Tooltip
          showDelayMs={200}
          placement="left"
          // In a portal, so it isn't clipped by the panel
          renderInPortal
          tooltipContent={description}
          variant="light"
          tooltipClassName="!max-w-[280px] !p-3 text-sm"
        >
          <FontAwesomeIcon
            icon={faCircleQuestion}
            className="size-3.5 text-gray-500 hover:text-blue-800 dark:text-gray-500-dark dark:hover:text-blue-800-dark"
          />
        </Tooltip>
      )}
    </div>
    {children}
  </div>
);

const ClipboardButton: FC<{
  icon: IconDefinition;
  label: string;
  title: string;
  onClick: () => void;
}> = ({ icon, label, title, onClick }) => (
  <Button
    variant="secondary"
    size="xs"
    className="gap-1"
    onClick={onClick}
    title={title}
  >
    <FontAwesomeIcon icon={icon} />
    {label}
  </Button>
);

export default ContinuousInputOptions;
