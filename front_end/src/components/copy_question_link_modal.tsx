"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import CopyQuestionLinkForm from "@/app/(main)/questions/[id]/components/key_factors/item_creation/question_link/copy_question_link_form";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { QuestionLinkDirection, QuestionLinkStrength } from "@/types/coherence";
import cn from "@/utils/core/cn";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  fromQuestionTitle: string;
  toQuestionTitle: string;
  defaultDirection?: QuestionLinkDirection;
  defaultStrength?: QuestionLinkStrength;
  onCreate?: (payload: {
    direction: QuestionLinkDirection;
    strength: QuestionLinkStrength;
    swapped: boolean;
  }) => void | Promise<void | boolean>;
  onViewQuestionLinks?: () => void;
  targetElementId?: string;
};

const CopyQuestionLinkModal: FC<Props> = ({
  isOpen,
  onClose,
  fromQuestionTitle,
  toQuestionTitle,
  defaultDirection = "positive",
  defaultStrength = "medium",
  onCreate,
  onViewQuestionLinks,
  targetElementId,
}) => {
  const t = useTranslations();

  const [direction, setDirection] =
    useState<QuestionLinkDirection>(defaultDirection);
  const [strength, setStrength] =
    useState<QuestionLinkStrength>(defaultStrength);
  const [sourceTitle, setSourceTitle] = useState(fromQuestionTitle);
  const [targetTitle, setTargetTitle] = useState(toQuestionTitle);
  const [isSwapped, setIsSwapped] = useState(false);
  const [mode, setMode] = useState<"form" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setMode("form");
    setDirection(defaultDirection);
    setStrength(defaultStrength);
    setSourceTitle(fromQuestionTitle);
    setTargetTitle(toQuestionTitle);
    setIsSwapped(false);
    setIsSubmitting(false);
  }, [
    isOpen,
    fromQuestionTitle,
    toQuestionTitle,
    defaultDirection,
    defaultStrength,
  ]);

  const handleSwap = () => {
    setSourceTitle((prevSource) => {
      const newSource = targetTitle;
      setTargetTitle(prevSource);
      return newSource;
    });
    setIsSwapped((prev) => !prev);
  };

  const internalClose = () => {
    setMode("form");
    onClose();
  };

  const handleCreate = async () => {
    if (!onCreate) {
      setMode("success");
      return;
    }
    try {
      setIsSubmitting(true);
      const result = await onCreate({
        direction,
        strength,
        swapped: isSwapped,
      });

      if (result === false) {
        return;
      }
      setMode("success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToQuestionLink = () => {
    if (typeof document === "undefined") return;

    let target: HTMLElement | null = null;

    if (targetElementId) {
      target = document.getElementById(targetElementId) as HTMLElement | null;
    }

    if (!target) {
      const container = document.getElementById("key-factors");
      target =
        container?.querySelector<HTMLElement>('[id^="question-link-kf-"]') ??
        document.querySelector<HTMLElement>('[id^="question-link-kf-"]');
    }

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleViewQuestionLinks = () => {
    onViewQuestionLinks?.();

    internalClose();

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(scrollToQuestionLink);
    } else {
      scrollToQuestionLink();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[560px] p-[28px]"
      closeButtonClassName="hidden"
    >
      <div className="flex flex-col gap-6 antialiased">
        <div className="flex w-full items-center justify-between">
          <h2 className="m-0 text-2xl text-blue-900 dark:text-blue-900-dark">
            {t("copyQuestionLink")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close", { defaultValue: "Close" })}
            className={cn(
              "text-2xl text-gray-500 no-underline hover:text-gray-600 active:text-gray-700",
              "dark:text-gray-500-dark dark:hover:text-gray-600-dark dark:active:text-gray-700-dark"
            )}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {mode === "form" && (
          <>
            <div className="space-y-6 text-base text-gray-900 dark:text-gray-900-dark">
              <p className="m-0">{t("copyQuestionLinkDescription")}</p>
              <p className="m-0">{t("copyQuestionLinkPrivate")}</p>
            </div>

            <CopyQuestionLinkForm
              direction={direction}
              setDirection={setDirection}
              strength={strength}
              setStrength={setStrength}
              sourceTitle={sourceTitle}
              targetTitle={targetTitle}
              handleSwap={handleSwap}
            />

            <div className="flex justify-end gap-3">
              <Button
                variant="tertiary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                {t("createQuestionLink")}
              </Button>
            </div>
          </>
        )}

        {mode === "success" && (
          <div className="flex flex-col gap-6">
            <div className="text-base text-gray-900 dark:text-gray-900-dark">
              <p className="m-0">
                {t.rich("copyQuestionLinkSuccess", {
                  strong: (chunks) => (
                    <span className="font-bold">{chunks}</span>
                  ),
                })}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="tertiary" onClick={internalClose}>
                {t("cancel")}
              </Button>
              <Button variant="primary" onClick={handleViewQuestionLinks}>
                {t("viewQuestionLinks")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default CopyQuestionLinkModal;
