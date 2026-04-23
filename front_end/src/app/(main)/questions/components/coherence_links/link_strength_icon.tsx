"use client";

import { faArrowsUpDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { STRENGTH_TIERS } from "@/types/coherence";
import { QuestionType } from "@/types/question";
import { getTermByDirectionAndQuestionType } from "@/utils/coherence";
import cn from "@/utils/core/cn";

type Props = {
  direction: number;
  strength: number;
  targetType: QuestionType | null;
  onChange?: (direction: number, strength: number) => void;
  onSwap?: () => void;
};

const strengthTierIndex = (strength: number): number => {
  const idx = STRENGTH_TIERS.findIndex((t) => t.value === strength);
  return idx >= 0 ? idx : 0;
};

const DirectionGlyph: FC<{ direction: number; strength: number }> = ({
  direction,
  strength,
}) => {
  const t = useTranslations();
  const litSegments = strengthTierIndex(strength) + 1;
  const char = direction === 1 ? "+" : "−";
  const textColorClass =
    direction === 1
      ? "text-olive-700 dark:text-olive-700-dark"
      : "text-salmon-600 dark:text-salmon-600-dark";
  const bgColorClass =
    direction === 1
      ? "bg-olive-100 dark:bg-olive-100-dark"
      : "bg-salmon-100 dark:bg-salmon-100-dark";
  return (
    <span className="inline-flex flex-col items-center gap-0.5" aria-hidden>
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wide",
          textColorClass
        )}
      >
        {t("impact")}
      </span>
      <span
        className={cn(
          "flex w-16 items-center justify-center rounded-md py-1 font-mono text-lg font-bold leading-none tracking-widest",
          textColorClass,
          bgColorClass
        )}
      >
        {char.repeat(litSegments)}
      </span>
    </span>
  );
};

const DirectionOption: FC<{
  optionDirection: number;
  currentDirection: number;
  label: string;
  onClick: () => void;
}> = ({ optionDirection, currentDirection, label, onClick }) => {
  const isPositive = optionDirection === 1;
  const selected = optionDirection === currentDirection;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded border-2 px-3 py-1.5 text-sm font-semibold capitalize transition-colors",
        isPositive
          ? "hover:bg-olive-200 dark:hover:bg-olive-200-dark border-olive-300 bg-olive-100 text-olive-800 dark:border-olive-300-dark dark:bg-olive-100-dark dark:text-olive-800-dark"
          : "border-salmon-300 bg-salmon-100 text-salmon-700 hover:bg-salmon-200 dark:border-salmon-300-dark dark:bg-salmon-100-dark dark:text-salmon-700-dark dark:hover:bg-salmon-200-dark",
        selected
          ? "ring-2 ring-gray-100 ring-offset-2 ring-offset-gray-700 dark:ring-gray-100-dark dark:ring-offset-gray-700-dark"
          : "opacity-70"
      )}
    >
      {label}
    </button>
  );
};

const StrengthOption: FC<{
  optionStrength: number;
  currentStrength: number;
  label: string;
  onClick: () => void;
}> = ({ optionStrength, currentStrength, label, onClick }) => {
  const selected = optionStrength === currentStrength;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm capitalize transition-colors dark:border-gray-300-dark",
        selected
          ? "bg-gray-200 font-semibold dark:bg-gray-200-dark"
          : "hover:bg-gray-100 dark:hover:bg-gray-100-dark"
      )}
    >
      {label}
    </button>
  );
};

const LinkStrengthIcon: FC<Props> = ({
  direction,
  strength,
  targetType,
  onChange,
  onSwap,
}) => {
  const t = useTranslations();
  const glyph = <DirectionGlyph direction={direction} strength={strength} />;

  if (!onChange) {
    return (
      <span
        className="inline-flex items-center px-1"
        role="img"
        aria-label={t("strength")}
      >
        {glyph}
      </span>
    );
  }

  return (
    <Popover className="relative">
      <PopoverButton
        className="inline-flex items-center rounded px-2 py-1 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-gray-200-dark"
        aria-label={t("editLink")}
      >
        {glyph}
      </PopoverButton>
      <PopoverPanel
        anchor="bottom end"
        className="z-40 mt-2 flex w-60 flex-col gap-3 rounded-md border border-gray-300 bg-gray-0 p-3 shadow-lg dark:border-gray-300-dark dark:bg-gray-0-dark"
      >
        <div className="flex gap-2">
          {[1, -1].map((d) => (
            <DirectionOption
              key={d}
              optionDirection={d}
              currentDirection={direction}
              label={t(getTermByDirectionAndQuestionType(d, targetType))}
              onClick={() => onChange(d, strength)}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {STRENGTH_TIERS.map((tier) => (
            <StrengthOption
              key={tier.value}
              optionStrength={tier.value}
              currentStrength={strength}
              label={t(tier.label)}
              onClick={() => onChange(direction, tier.value)}
            />
          ))}
        </div>
        {onSwap && (
          <button
            type="button"
            onClick={onSwap}
            className="flex items-center justify-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm text-blue-700 hover:bg-gray-100 dark:border-gray-300-dark dark:text-blue-700-dark dark:hover:bg-gray-100-dark"
          >
            <FontAwesomeIcon icon={faArrowsUpDown} />
            {t("swapCausality")}
          </button>
        )}
      </PopoverPanel>
    </Popover>
  );
};

export default LinkStrengthIcon;
