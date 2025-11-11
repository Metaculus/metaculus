"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { ElementType, FC, PropsWithChildren, useState } from "react";

import { useQuestionLayoutSafe } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { BECommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorsAddModal from "./add_modal/key_factors_add_modal";

type Props = {
  onClick: (event: React.MouseEvent) => void;
  className?: string;
  as?: ElementType;
};

export const AddButton: FC<PropsWithChildren<Props>> = ({
  onClick,
  className,
  children,
  as,
}) => {
  return (
    <Button
      className={cn(
        "cursor-pointer gap-2 px-3 py-1 text-sm capitalize",
        className
      )}
      size="xs"
      variant="tertiary"
      as={as}
      onClick={(e) => onClick(e)}
    >
      <FontAwesomeIcon icon={faPlus} className="size-4 p-0" />
      {children}
    </Button>
  );
};

type AddKeyFactorsButtonProps = {
  className?: string;
  post: PostWithForecasts;
  onClick?: () => void;
  as?: ElementType;
};

export const AddKeyFactorsButton: FC<AddKeyFactorsButtonProps> = ({
  className,
  post,
  onClick,
  as,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setCurrentModal } = useModal();
  const layout = useQuestionLayoutSafe();

  const scrollToNewKeyFactors = (comment: BECommentType) => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 640) return;
    layout?.requestKeyFactorsExpand?.();
    const rawKfs = comment.key_factors ?? [];

    const first = rawKfs[0];
    if (!first?.id) {
      return;
    }

    const targetId = `key-factor-${first.id}`;
    const scrollWhenReady = (attemptsLeft: number) => {
      if (attemptsLeft <= 0) {
        return;
      }
      const sectionEl = document.getElementById("key-factors-section-toggle");
      if (sectionEl?.getAttribute("data-headlessui-state") !== "open") {
        sectionEl?.querySelector("button")?.click();
      }
      const el = document.getElementById(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY - 55;
        window.scrollTo({ top: absoluteTop, behavior: "smooth" });
        return;
      }
      setTimeout(() => scrollWhenReady(attemptsLeft - 1), 100);
    };

    scrollWhenReady(15);
  };

  return (
    <>
      {user && (
        <KeyFactorsAddModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          post={post}
          user={user}
          onSuccess={(comment) => {
            scrollToNewKeyFactors(comment);
          }}
        />
      )}
      <AddButton
        onClick={(e) => {
          e.stopPropagation();
          if (!user) {
            setCurrentModal({ type: "signin" });
            return;
          }
          setIsModalOpen(true);
          onClick?.();
        }}
        className={className}
        as={as}
      >
        {t("addKeyFactor")}
      </AddButton>
    </>
  );
};
