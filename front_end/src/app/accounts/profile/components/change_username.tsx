"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import changeUsernameAction, {
  ChangeUsernameState,
} from "@/app/accounts/profile/actions";
import {
  ChangeUsernameSchema,
  changeUsernameSchema,
} from "@/app/accounts/schemas";
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
      <Button onClick={() => setModalIsOpen(true)}>
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
  const [state, formAction] = useFormState<ChangeUsernameState, FormData>(
    changeUsernameAction,
    null
  );
  useEffect(() => {
    if (!state?.user) {
      return;
    }

    setUser(state.user);
    onClose(true);
  }, [state?.user]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="dark">
      <div className="flex max-w-lg	 flex-col items-center text-center">
        <h3 className="mb-4 text-lg">{t("changeUsernameHeading")}</h3>
        <p className="mb-3">{t("changeUsernameDescription")}</p>
        <form className="flex w-full max-w-44 flex-col" action={formAction}>
          <Input
            type="text"
            name="username"
            placeholder={t("newUsernamePlaceholder")}
            className="border border-gray-600-dark bg-transparent px-[5px] py-[3px] font-sans"
          />
          <FormError
            errors={state?.errors}
            className="text-red-500-dark"
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
            className="text-red-500-dark"
          />
          {/* Global errors container */}
          <FormError
            errors={state?.errors}
            name="non_field_errors"
            className="text-red-500-dark"
          />
          <div className="mt-4">
            <Button
              variant="secondary"
              type="submit"
              value="Submit"
              className="w-full bg-blue-900-dark font-sans uppercase tracking-[0.08em]"
            >
              {t("submitButton")}
            </Button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default ChangeUsername;
