"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveAs } from "file-saver";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import {
  emailData,
  getPostZipData,
  getWhitelistStatus,
} from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useAuth } from "@/contexts/auth_context";
import { Post } from "@/types/post";
import { DownloadAggregationMethod } from "@/types/question";
import { DataParams, WhitelistStatus } from "@/types/utils";
import { base64ToBlob } from "@/utils/files";

import AggregationMethodsPicker from "./aggregation_methods_picker";

type SubmissionType = "download" | "email";

const schema = z.object({
  aggregation_methods: z
    .array(z.nativeEnum(DownloadAggregationMethod))
    .nonempty(),
  minimize: z.boolean(),
  include_comments: z.boolean(),
  include_scores: z.boolean(),
  include_user_data: z.boolean(),
  include_bots: z.boolean().optional(),
  anonymized: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
};

// TODO: make this modal more generic so it
// isn't married to post-level requests.
const DataRequestModal: FC<Props> = ({ isOpen, onClose, post }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isLoggedOut = !user;

  const [whitelistStatus, setWhitelistStatus] = useState({
    is_whitelisted: false,
    view_deanonymized_data: false,
    isLoaded: false,
  } as WhitelistStatus & { isLoaded: boolean });

  useEffect(() => {
    if (!isOpen || whitelistStatus.isLoaded) {
      return;
    }
    const fetchWhitelistStatus = async () => {
      try {
        const status = await getWhitelistStatus({
          post_id: post.id,
        });
        setWhitelistStatus({ ...status, isLoaded: true });
      } catch (error) {
        console.error("Error fetching whitelist status:", error);
        // Set as loaded even on error to avoid infinite retries
        setWhitelistStatus((prev) => ({ ...prev, isLoaded: true }));
      }
    };
    fetchWhitelistStatus();
  }, [isOpen, whitelistStatus.isLoaded, post.id]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<FormValues>({
    mode: "all",
    resolver: zodResolver(schema),
    defaultValues: {
      aggregation_methods: [DownloadAggregationMethod.recency_weighted],
      minimize: true,
      include_comments: false,
      include_scores: false,
      include_user_data: true,
      include_bots: undefined,
      anonymized: !whitelistStatus.view_deanonymized_data,
    },
  });

  const minimize = useWatch({ control, name: "minimize" });
  const includeBots = useWatch({ control, name: "include_bots" });
  const isDownloadDisabled = !minimize || includeBots !== undefined;

  useEffect(() => {
    if (whitelistStatus.isLoaded) {
      reset({
        aggregation_methods: [DownloadAggregationMethod.recency_weighted],
        minimize: true,
        include_comments: false,
        include_scores: false,
        include_user_data: true,
        include_bots: undefined,
        anonymized: !whitelistStatus.view_deanonymized_data,
      });
    }
  }, [whitelistStatus.isLoaded, whitelistStatus.view_deanonymized_data, reset]);

  const [pendingSubmission, setPendingSubmission] =
    useState<SubmissionType | null>(null);
  const isPending = pendingSubmission !== null;

  const handleValidatedSubmit = async (
    data: FormValues,
    type: SubmissionType
  ) => {
    setPendingSubmission(type);

    const params: DataParams = {
      post_id: post.id,
      ...data,
    };
    if (type === "email") {
      try {
        const response = await emailData(params);
        toast.success(response.message);
      } catch (error) {
        toast.error(t("downloadQuestionDataError") + error);
      } finally {
        setPendingSubmission(null);
      }
    } else {
      // type === "download"
      try {
        const base64 = await getPostZipData(params);
        const blob = base64ToBlob(base64);
        const title = post.short_title || post.title || "data";
        const filename = `${title.replaceAll(" ", "_")}.zip`;
        saveAs(blob, filename);
      } catch (error) {
        toast.error(t("downloadQuestionDataError") + error);
      } finally {
        setPendingSubmission(null);
      }
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex w-full flex-col gap-2">
        <Section title={t("aggregationMethods")}>
          <Controller
            control={control}
            name={"aggregation_methods"}
            render={({ field: { value, onChange } }) => (
              <AggregationMethodsPicker
                methods={value}
                onChange={onChange}
                disabled={isLoggedOut}
                errors={errors.aggregation_methods}
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
            name="minimize"
            label={t("summarizeAggregations")}
            errors={errors.minimize}
            disabled={isLoggedOut}
          />
          <CheckboxField
            control={control}
            name="include_scores"
            label={t("scoreData")}
            errors={errors.include_scores}
            disabled={isLoggedOut}
          />
          <CheckboxField
            control={control}
            name="include_user_data"
            label={t("includeUserData")}
            errors={errors.include_user_data}
          />
          {!!control._getWatch("include_user_data") ? (
            <CheckboxField
              control={control}
              name="include_comments"
              label={t("commentData")}
              errors={errors.include_comments}
              disabled={isLoggedOut}
            />
          ) : null}
          {(!!user?.is_superuser || whitelistStatus.is_whitelisted) && (
            <>
              {!!control._getWatch("include_user_data") ? (
                <CheckboxField
                  control={control}
                  name="include_bots"
                  label={t("includeBots")}
                  errors={errors.include_bots}
                />
              ) : null}
              {whitelistStatus.view_deanonymized_data &&
              !!control._getWatch("include_user_data") ? (
                <CheckboxField
                  control={control}
                  name="anonymized"
                  label={t("anonymize")}
                  errors={errors.anonymized}
                />
              ) : null}
            </>
          )}
        </Section>

        <hr className="my-2" />

        <div className="flex gap-1">
          <Button
            className="flex-1"
            disabled={isDownloadDisabled || isPending}
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

export default DataRequestModal;
