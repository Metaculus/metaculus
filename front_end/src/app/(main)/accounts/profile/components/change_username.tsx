"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState, useActionState } from "react";
import { useForm } from "react-hook-form";

import changeUsernameAction, {
  ChangeUsernameState,
} from "@/app/(main)/accounts/profile/actions";
import {
  ChangeUsernameSchema,
  changeUsernameSchema,
} from "@/app/(main)/accounts/schemas";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

const ChangeUsername: FC = () => {
  const t = useTranslations();
  const [modalIsOpen, setModalIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalIsOpen(true)} variant="link">
        {t("changeUsernameButton")}
      </Button>
      <ChangeUsernameModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
      />
    </>
  );
};

const ChangeUsernameModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();
  const { setUser } = useAuth();
  const { register } = useForm<ChangeUsernameSchema>({
    resolver: zodResolver(changeUsernameSchema),
  });
  const [state, formAction] = useActionState<ChangeUsernameState, FormData>(
    changeUsernameAction,
    null
  );
  useEffect(() => {
    if (!state?.user) {
      return;
    }

    setUser(state.user);
    onClose(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.user]);

  return (
    <BaseModal
      label={t("changeUsernameHeading")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form
        className="flex w-full max-w-44 max-w-lg flex-col items-center gap-4 text-center"
        action={formAction}
      >
        {t("changeUsernameDescription")}
        <div>
          <Input
            type="text"
            name="username"
            placeholder={t("newUsernamePlaceholder")}
            className="border border-gray-600-dark bg-transparent px-[5px] py-[3px] font-sans"
          />
          <FormError
            errors={state?.errors}
            className="text-red-500 dark:text-red-500-dark"
            {...register("username")}
          />
          <Input
            type="text"
            placeholder={t("confirmUsernamePlaceholder")}
            className="border border-gray-600-dark border-t-transparent bg-transparent px-[5px] py-[3px] font-sans"
            {...register("usernameConfirm")}
          />
          <FormError
            name="usernameConfirm"
            errors={state?.errors}
            className="text-red-500 dark:text-red-500-dark"
          />
        </div>
        <div className="flex justify-center">
          {/* Global errors container */}
          <Button type="submit" value="Submit" className="uppercase">
            {t("submit")}
          </Button>
          <FormError
            errors={state?.errors}
            name="non_field_errors"
            className="text-red-500 dark:text-red-500-dark"
          />
        </div>
      </form>
    </BaseModal>
  );
};

export default ChangeUsername;
