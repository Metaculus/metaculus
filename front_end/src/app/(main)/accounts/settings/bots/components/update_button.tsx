"use client";

import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateBot } from "@/app/(main)/accounts/settings/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { MarkdownEditorField, Input } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import { CurrentBot } from "@/types/users";
import { extractError } from "@/utils/core/errors";

type Props = {
  bot: CurrentBot;
};

const BotUpdateButton: FC<Props> = ({ bot }) => {
  const t = useTranslations();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const schema = z.object({
    username: z.string().min(1, t("errorRequired")),
    bio: z.string().optional(),
    website: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: bot.username,
      bio: bot.bio || "",
      website: bot.website || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const response = await updateBot(bot.id, data);

    if (response.errors) {
      setError("root", {
        type: "manual",
        message: extractError(response.errors),
      });
    } else {
      setIsEditModalOpen(false);
      router.refresh(); // Invalidate page to show new data
    }
  };

  return (
    <>
      <Button size="xs" onClick={() => setIsEditModalOpen(true)}>
        {t("editProfile")}
      </Button>

      <BaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        label={t("editProfile")}
        className="mx-3 max-w-md"
        withCloseButton
      >
        <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
          {t("editBotDescription")}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputContainer labelText={t("botUsername")}>
            <Input
              {...register("username")}
              errors={errors}
              className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            />
          </InputContainer>

          <InputContainer labelText={t("bio")}>
            <MarkdownEditorField
              control={control}
              name="bio"
              errors={errors}
              className="max-h-[200px]"
            />
          </InputContainer>

          <InputContainer labelText={t("website")}>
            <Input
              {...register("website")}
              errors={errors}
              className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
            />
          </InputContainer>

          {errors.root && (
            <div className="mt-2 text-sm text-red-500 dark:text-red-500-dark">
              {errors.root.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
              variant="secondary"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} variant="primary">
              {isSubmitting ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </form>
      </BaseModal>
    </>
  );
};

export default BotUpdateButton;
