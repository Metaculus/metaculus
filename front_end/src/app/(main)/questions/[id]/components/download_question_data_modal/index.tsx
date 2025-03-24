"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveAs } from "file-saver";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { getPostZipData } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useAuth } from "@/contexts/auth_context";
import { Post } from "@/types/post";
import { DownloadAggregationMethod } from "@/types/question";
import { base64ToBlob } from "@/utils/files";

import AggregationMethodsPicker from "./aggregation_methods_picker";

type SubmissionType = "download" | "email";

const schema = z.object({
  aggregationMethods: z
    .array(z.nativeEnum(DownloadAggregationMethod))
    .nonempty(),
  summarizeAggregations: z.boolean(),
  includeQuestionData: z.boolean(),
  includeCommentsData: z.boolean(),
  includeScoreData: z.boolean(),
  includeUserData: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
};

const DownloadQuestionDataModal: FC<Props> = ({ isOpen, onClose, post }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isLoggedOut = !user;

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
  } = useForm<FormValues>({
    mode: "all",
    resolver: zodResolver(schema),
    defaultValues: {
      aggregationMethods: [DownloadAggregationMethod.recency_weighted],
      summarizeAggregations: true,
      includeQuestionData: true,
      includeCommentsData: false,
      includeScoreData: false,
      includeUserData: false,
    },
  });

  const [pendingSubmission, setPendingSubmission] =
    useState<SubmissionType | null>(null);
  const isPending = pendingSubmission !== null;

  const handleValidatedSubmit = async (
    _data: FormValues,
    type: SubmissionType
  ) => {
    setPendingSubmission(type);

    // TODO: Implement email functionality and handle request params
    try {
      const base64 = await getPostZipData(post.id);
      const blob = base64ToBlob(base64);
      const filename = `${post.short_title.replaceAll(" ", "_")}.zip`;
      saveAs(blob, filename);
    } catch (error) {
      toast.error(t("downloadQuestionDataError") + error);
    } finally {
      setPendingSubmission(null);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex w-full flex-col gap-2">
        <Section title={t("aggregationMethods")}>
          <Controller
            control={control}
            name={"aggregationMethods"}
            render={({ field: { value, onChange } }) => (
              <AggregationMethodsPicker
                methods={value}
                onChange={onChange}
                disabled={isLoggedOut}
                errors={errors.aggregationMethods}
              />
            )}
          />
        </Section>
        <Section
          title={t("configuration")}
          subtitle={isLoggedOut ? t("loginConfigurationMessage") : undefined}
        >
          <CheckboxField
            control={control}
            name="summarizeAggregations"
            label={t("summarizeAggregations")}
            errors={errors.summarizeAggregations}
            disabled={isLoggedOut}
          />
          <CheckboxField
            control={control}
            name="includeQuestionData"
            label={t("questionData")}
            errors={errors.includeQuestionData}
            disabled={isLoggedOut}
          />
          <CheckboxField
            control={control}
            name="includeCommentsData"
            label={t("commentData")}
            errors={errors.includeCommentsData}
            disabled={isLoggedOut}
          />
          <CheckboxField
            control={control}
            name="includeScoreData"
            label={t("scoreData")}
            errors={errors.includeScoreData}
            disabled={isLoggedOut}
          />
          {!!user?.is_superuser && (
            <CheckboxField
              control={control}
              name="includeUserData"
              label={t("includeUserData")}
              errors={errors.includeUserData}
            />
          )}
        </Section>

        <hr className="my-2" />

        <div className="flex gap-1">
          <Button
            className="flex-1"
            disabled={isDirty || isPending}
            onClick={handleSubmit((data) =>
              handleValidatedSubmit(data, "download")
            )}
          >
            {pendingSubmission === "download" && <LoadingSpinner size="sm" />}
            {t("downloadData")}
          </Button>
          <Button
            className="flex-1"
            disabled={isLoggedOut || isPending}
            onClick={handleSubmit((data) =>
              handleValidatedSubmit(data, "email")
            )}
          >
            {pendingSubmission === "email" && <LoadingSpinner size="sm" />}
            {t("emailData")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

const Section: FC<PropsWithChildren<{ title: string; subtitle?: string }>> = ({
  title,
  subtitle,
  children,
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-col gap-0.5">
      <h3 className="m-0 text-lg font-bold">{title}</h3>
      {!!subtitle && (
        <span className="text-sm italic text-gray-700 dark:text-gray-700-dark">
          {subtitle}
        </span>
      )}
    </div>
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);

export default DownloadQuestionDataModal;
