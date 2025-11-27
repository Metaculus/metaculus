"use client";

import {
  faCommentDots,
  faCopy,
  faEllipsis,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/core/cn";

import ThumbVoteButtons, { ThumbVoteSelection } from "../thumb_vote_buttons";

type Props = {
  initialAgree?: number;
  initialDisagree?: number;
  onChange?: (next: "agree" | "disagree" | null) => void;
  onCopyToMyAccount?: () => void;
  onReportSpam?: () => void;
  onDispute?: () => void;
  className?: string;
};

const QuestionLinkAgreeVoter: FC<Props> = ({
  initialAgree = 0,
  initialDisagree = 0,
  onChange,
  onCopyToMyAccount,
  onReportSpam,
  onDispute,
  className,
}) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  const [agree, setAgree] = useState(initialAgree);
  const [disagree, setDisagree] = useState(initialDisagree);
  const [selected, setSelected] = useState<ThumbVoteSelection>(null);

  const handleVote = (value: "agree" | "disagree") => {
    let next: "agree" | "disagree" | null = value;

    if (selected === "up" && value === "agree") {
      setAgree((x) => Math.max(0, x - 1));
      setSelected(null);
      next = null;
    } else if (selected === "down" && value === "disagree") {
      setDisagree((x) => Math.max(0, x - 1));
      setSelected(null);
      next = null;
    } else {
      if (value === "agree") {
        setAgree((x) => x + 1);
        if (selected === "down") setDisagree((x) => Math.max(0, x - 1));
        setSelected("up");
      } else {
        setDisagree((x) => x + 1);
        if (selected === "up") setAgree((x) => Math.max(0, x - 1));
        setSelected("down");
      }
    }

    onChange?.(next);
  };

  const menuItems: MenuItemProps[] = [
    {
      id: "copy-to-account",
      element: (
        <div
          className={cn(
            "inline-flex cursor-pointer items-center justify-end gap-2.5 whitespace-nowrap px-3 py-2 text-xs text-blue-700 hover:bg-blue-100 dark:text-blue-700-dark dark:hover:bg-blue-100-dark",
            "border-b-[1px] border-gray-300 dark:border-gray-300-dark"
          )}
          onClick={() => {
            if (onCopyToMyAccount) {
              return onCopyToMyAccount();
            }

            setCurrentModal({
              type: "confirm",
              data: {
                title: t("copyToMyAccount"),
                description:
                  "Copying this question link to your account isn't wired up yet, but will be available soon.",
                actionText: "OK",
                onConfirm: () => {},
              },
            });
          }}
        >
          <span>{t("copyToMyAccount")}</span>
          <FontAwesomeIcon icon={faCopy} />
        </div>
      ),
    },
    {
      id: "report-spam",
      element: (
        <div
          className={cn(
            "inline-flex cursor-pointer items-center justify-end gap-2.5 whitespace-nowrap px-3 py-2 text-xs text-blue-700 hover:bg-blue-100 dark:text-blue-700-dark dark:hover:bg-blue-100-dark",
            "border-b-[1px] border-gray-300 dark:border-gray-300-dark"
          )}
          onClick={() => {
            setCurrentModal({
              type: "confirm",
              data: {
                title: t("reportSpam"),
                description: t("reportSpamConfirmDescription"),
                actionText: t("sendReport"),
                onConfirm: () => {
                  if (onReportSpam) {
                    onReportSpam();
                    return;
                  }
                },
              },
            });
          }}
        >
          <span>{t("reportSpam")}</span>
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>
      ),
    },
    {
      id: "dispute",
      element: (
        <div
          className="inline-flex cursor-pointer items-center justify-end gap-2.5 whitespace-nowrap px-3 py-2 text-xs text-blue-700 hover:bg-blue-100 dark:text-blue-700-dark dark:hover:bg-blue-100-dark"
          onClick={() => {
            if (onDispute) {
              return onDispute();
            }

            setCurrentModal({
              type: "disputeKeyFactor",
              data: {
                keyFactorId: 0,
                parentCommentId: 0,
                postId: 0,
                onOptimisticAdd: async () => 0,
                onFinalize: () => {},
                onRemove: () => {},
              },
            });
          }}
        >
          <span>{t("dispute")}</span>
          <FontAwesomeIcon icon={faCommentDots} />
        </div>
      ),
    },
  ];

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <ThumbVoteButtons
        upCount={agree}
        downCount={disagree}
        upLabel={t("agree")}
        downLabel={t("disagree")}
        selected={selected}
        disabled={false}
        onClickUp={() => handleVote("agree")}
        onClickDown={() => handleVote("disagree")}
      />

      <DropdownMenu
        items={menuItems}
        className="border-gray-300 dark:border-gray-300-dark"
      >
        <Button
          aria-label="menu"
          variant="tertiary"
          size="sm"
          presentationType="icon"
        >
          <FontAwesomeIcon icon={faEllipsis} />
        </Button>
      </DropdownMenu>
    </div>
  );
};

export default QuestionLinkAgreeVoter;
