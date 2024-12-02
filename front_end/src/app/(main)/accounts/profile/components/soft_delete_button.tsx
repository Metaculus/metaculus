"use client";

import { useTranslations } from "next-intl";
import { FC, useState, useTransition } from "react";
import Button from "@/components/ui/button";
import BaseModal from "@/components/base_modal";
import { softDeleteUserAction } from "@/app/(main)/accounts/profile/actions";

type SoftDeleteButtonProps = {
  id: number;
};

type SoftDeleteModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  id: number;
};

const SoftDeleteButton: FC<SoftDeleteButtonProps> = ({ id }) => {
  const t = useTranslations();
  const [modalIsOpen, setModalIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalIsOpen(true)}>
        {t("markUserAsSpamButton")}
      </Button>
      <SoftDeleteModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        id={id}
      />
    </>
  );
};

const SoftDeleteModal: FC<SoftDeleteModalType> = ({ isOpen, onClose, id }) => {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    startTransition(async () => {
      await softDeleteUserAction(id);
      onClose(true);
    });
  };

  return (
    <BaseModal label={t("markUserAsSpam?")} isOpen={isOpen} onClose={onClose}>
      <form
        method="post"
        action={handleSubmit}
        className="flex w-full max-w-lg flex-col items-center gap-4 text-center"
      >
        <div className="flex justify-center gap-4">
          <Button type="button" onClick={() => onClose(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {t("delete")}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default SoftDeleteButton;
