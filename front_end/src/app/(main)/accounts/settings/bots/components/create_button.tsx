"use client";

import { faCopy, faPlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { createBot } from "@/app/(main)/accounts/settings/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import { useAuth } from "@/contexts/auth_context";
import { extractError } from "@/utils/core/errors";

type Props = {
  disabled?: boolean;
};

const BotCreateButton: FC<Props> = ({ disabled }) => {
  const t = useTranslations();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>();
  const { user } = useAuth();

  const schema = z.object({
    username: z.string().min(1, t("errorRequired")),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const response = await createBot(data.username);

    if (response.errors) {
      setError("root", {
        type: "manual",
        message: extractError(response.errors),
      });
    } else if (response.token) {
      setSuccessToken(response.token);
      router.refresh();
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSuccessToken(null);
    reset();
  };

  return (
    <>
      <Button disabled={disabled} onClick={() => setIsModalOpen(true)}>
        <FontAwesomeIcon icon={faPlus} width={14} />
        {t("createBot")}
      </Button>

      {/* Creation Modal */}
      <BaseModal
        isOpen={isModalOpen && !successToken}
        onClose={handleClose}
        label={t("createBot")}
        className="max-w-md"
        withCloseButton
      >
        <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
          {t("createBotDescription")}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputContainer labelText={t("botUsername")}>
            <Input
              {...register("username")}
              errors={errors}
              placeholder={`${user?.username}-bot`}
              className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            />
          </InputContainer>

          {errors.root && (
            <div className="mt-2 text-sm text-red-500">
              {errors.root.message}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => handleClose()}
              disabled={isSubmitting}
              variant="secondary"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
              variant="primary"
            >
              {isSubmitting ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                t("submit")
              )}
            </Button>
          </div>
        </form>
      </BaseModal>

      {/* Success Modal */}
      <BaseModal
        isOpen={isModalOpen && !!successToken}
        onClose={handleClose}
        label={t("createBot")}
        className="max-w-md"
        withCloseButton
      >
        <div className="space-y-4">
          <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
            {t("botCreatedDescription")}
          </p>

          {successToken && (
            <div className="flex items-center gap-2.5">
              <Input
                className="dark:disabled-text-gray-600-dark block w-full rounded border border-gray-700 bg-inherit p-2.5 font-mono disabled:border-gray-400 disabled:bg-gray-200 disabled:text-gray-600 dark:border-gray-700-dark disabled:dark:border-gray-400-dark disabled:dark:bg-gray-200-dark"
                value={successToken}
                type="text"
                readOnly
              />
              <div className="flex gap-2.5">
                <Button
                  aria-label={t("copyApiToken")}
                  variant="tertiary"
                  size="sm"
                  presentationType="icon"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(successToken)
                      .then(() => toast(t("copiedApiTokenMessage")))
                  }
                >
                  <FontAwesomeIcon icon={faCopy} />
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleClose}>{t("close")}</Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default BotCreateButton;
