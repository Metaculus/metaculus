"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveAs } from "file-saver";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import {
  FC,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { emailData, getPostZipData } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { Tabs, TabsSection, useTabsContext } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth_context";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { Post, PostWithForecasts } from "@/types/post";
import { DownloadAggregationMethod } from "@/types/question";
import { DataParams } from "@/types/utils";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { base64ToBlob } from "@/utils/files";

import AggregationMethodsPicker from "./aggregation_methods_picker";
import ExportChartsTab from "./export_charts/export_charts_tab";

type SubmissionType = "download" | "email";

const schema = z.object({
  aggregation_methods: z
    .array(z.nativeEnum(DownloadAggregationMethod))
    .nonempty(),
  minimize: z.boolean(),
  include_comments: z.boolean(),
  include_scores: z.boolean(),
  include_user_data: z.boolean(),
  include_key_factors: z.boolean(),
  include_bots: z.enum(["default", "true", "false"]).optional(),
  anonymized: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  postId: number | number[];
  title?: string;
  post?: Post;
};

const DataRequestModal: FC<Props> = ({
  isOpen,
  onClose,
  postId,
  title,
  post,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isLoggedOut = !user;

  const postIds = useMemo(
    () => (Array.isArray(postId) ? postId : [postId]),
    [postId]
  );
  const isMultiplePosts = postIds.length > 1;
  // Use first post ID for whitelist status check
  const primaryPostId = postIds[0];
  const canExportCharts = !isMultiplePosts && !!post;

  const [dataAccessStatus, setDataAccessStatus] = useState({
    has_data_access: false,
    view_deanonymized_data: false,
    isLoaded: false,
  });

  useEffect(() => {
    if (isOpen) {
      sendAnalyticsEvent("downloadQuestionDataOverlayOpened", {
        postId: primaryPostId,
      });
    }
  }, [isOpen, primaryPostId]);

  useEffect(() => {
    // Skip whitelist status for multiple posts - not supported
    if (isMultiplePosts) {
      setDataAccessStatus({
        has_data_access: false,
        view_deanonymized_data: false,
        isLoaded: true,
      });
      return;
    }

    if (!isOpen || dataAccessStatus.isLoaded) {
      return;
    }
    const fetchDataAccessStatus = async () => {
      try {
        const status = await ClientPostsApi.getDataAccessStatus({
          post_id: primaryPostId,
        });
        setDataAccessStatus({ ...status, isLoaded: true });
      } catch (error) {
        console.error("Error fetching data access status:", error);
        // Set as loaded even on error to avoid infinite retries
        setDataAccessStatus((prev) => ({ ...prev, isLoaded: true }));
      }
    };
    fetchDataAccessStatus();
  }, [isOpen, dataAccessStatus.isLoaded, primaryPostId, isMultiplePosts]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm<FormValues>({
    mode: "all",
    resolver: zodResolver(schema),
    defaultValues: {
      aggregation_methods: [DownloadAggregationMethod.recency_weighted],
      minimize: true,
      include_comments: false,
      include_scores: false,
      include_user_data: true,
      include_key_factors: false,
      include_bots: undefined,
      anonymized: !dataAccessStatus.view_deanonymized_data,
    },
  });

  const { minimize, include_bots, include_user_data } = watch();
  const isDownloadDisabled =
    !minimize || (!isNil(include_bots) && include_bots !== "default");

  useEffect(() => {
    if (dataAccessStatus.isLoaded) {
      reset({
        ...watch(),
        anonymized: !dataAccessStatus.view_deanonymized_data,
      });
    }
  }, [
    dataAccessStatus.isLoaded,
    dataAccessStatus.view_deanonymized_data,
    watch,
    reset,
  ]);

  const [pendingSubmission, setPendingSubmission] =
    useState<SubmissionType | null>(null);
  const isPending = pendingSubmission !== null;

  const handleValidatedSubmit = async (
    data: FormValues,
    type: SubmissionType
  ) => {
    setPendingSubmission(type);

    // Transform include_bots value for API
    const transformedData = {
      ...data,
      include_bots:
        data.include_bots === "default"
          ? undefined
          : data.include_bots === "true",
    };

    // Use post_ids for multiple posts, post_id for single post
    const params: DataParams = {
      ...(isMultiplePosts ? { post_ids: postIds } : { post_id: primaryPostId }),
      ...transformedData,
    };
    if (type === "email") {
      try {
        const response = await emailData(params);
        sendAnalyticsEvent("questionDataEmailed", { postId: primaryPostId });
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
        const defaultTitle = isMultiplePosts
          ? `metaculus_data_${postIds.length}_posts`
          : "data";
        const filename = `${(title || defaultTitle).replaceAll(" ", "_")}.zip`;
        saveAs(blob, filename);
        sendAnalyticsEvent("questionDataDownloaded", {
          postId: primaryPostId,
        });
      } catch (error) {
        toast.error(t("downloadQuestionDataError") + error);
      } finally {
        setPendingSubmission(null);
      }
    }
  };

  const includeBotOptions = [
    { value: "default", label: t("default") },
    { value: "true", label: t("includeAll") },
    { value: "false", label: t("excludeAll") },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-lg font-bold leading-tight">
            {t("downloadQuestionData")}
          </h2>
          <p className="m-0 text-sm text-gray-600 dark:text-gray-600-dark">
            {t("exportSubtitle")}
          </p>
        </div>

        <Tabs defaultValue="download-data" className="!bg-transparent">
          <SegmentedTabBar
            tabs={[
              { value: "download-data", label: t("downloadData") },
              ...(canExportCharts
                ? [{ value: "export-charts", label: t("exportCharts") }]
                : []),
            ]}
          />

          <TabsSection value="download-data" className="mt-3">
            <div className="flex flex-col gap-5">
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
                subtitle={
                  isLoggedOut ? t("loginConfigurationMessage") : undefined
                }
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
                  name="include_key_factors"
                  label={t("keyFactorData")}
                  errors={errors.include_key_factors}
                  disabled={isLoggedOut}
                />
                <CheckboxField
                  control={control}
                  name="include_user_data"
                  label={t("includeUserData")}
                  errors={errors.include_user_data}
                />
                {!!include_user_data ? (
                  <CheckboxField
                    control={control}
                    name="include_comments"
                    label={t("commentData")}
                    errors={errors.include_comments}
                    disabled={isLoggedOut}
                  />
                ) : null}
                {dataAccessStatus.has_data_access && (
                  <>
                    {include_user_data ? (
                      <div>
                        <label className="mb-2 block text-sm font-semibold">
                          {t("includeBots")}
                        </label>
                        <Controller
                          control={control}
                          name="include_bots"
                          render={({ field: { value, onChange } }) => (
                            <select
                              value={value || "default"}
                              onChange={(e) => onChange(e.target.value)}
                              className="w-full rounded-md border border-gray-300 bg-gray-0 px-3 py-2 text-sm shadow-sm dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-900-dark"
                            >
                              {includeBotOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        {errors.include_bots && (
                          <span className="text-sm text-red-500">
                            {errors.include_bots.message}
                          </span>
                        )}
                      </div>
                    ) : null}
                    {dataAccessStatus.view_deanonymized_data &&
                    include_user_data ? (
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

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  disabled={isDownloadDisabled || isPending}
                  onClick={handleSubmit((data) =>
                    handleValidatedSubmit(data, "download")
                  )}
                >
                  {pendingSubmission === "download" && (
                    <LoadingSpinner size="sm" />
                  )}
                  {t("downloadData")}
                </Button>
                <Button
                  className="flex-1"
                  disabled={isLoggedOut || isPending}
                  onClick={handleSubmit((data) =>
                    handleValidatedSubmit(data, "email")
                  )}
                >
                  {pendingSubmission === "email" && (
                    <LoadingSpinner size="sm" />
                  )}
                  {t("emailData")}
                </Button>
              </div>
            </div>
          </TabsSection>

          {canExportCharts && post ? (
            <TabsSection value="export-charts" className="mt-3">
              <ExportChartsTab post={post as PostWithForecasts} />
            </TabsSection>
          ) : null}
        </Tabs>
      </div>
    </BaseModal>
  );
};

const SegmentedTabBar: FC<{
  tabs: { value: string; label: ReactNode }[];
}> = ({ tabs }) => {
  const { active, setActive } = useTabsContext();
  return (
    <div className="flex rounded-lg bg-gray-200 p-1 dark:bg-gray-200-dark">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => setActive(tab.value)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            active === tab.value
              ? "bg-gray-0 text-gray-900 shadow-sm dark:bg-gray-0-dark dark:text-gray-900-dark"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-600-dark dark:hover:text-gray-900-dark"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const Section: FC<PropsWithChildren<{ title: string; subtitle?: string }>> = ({
  title,
  subtitle,
  children,
}) => (
  <div>
    <h3 className="m-0 mb-3 text-sm font-semibold">{title}</h3>
    {!!subtitle && (
      <p className="m-0 -mt-2 mb-3 text-xs italic text-gray-700 dark:text-gray-700-dark">
        {subtitle}
      </p>
    )}
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

export default DataRequestModal;
