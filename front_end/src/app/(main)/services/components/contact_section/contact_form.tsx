"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/ui/button";
import { FormErrorMessage, Input, Textarea } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Select from "@/components/ui/select";
import { ServiceType } from "@/constants/services";
import { TranslationKey } from "@/types/translations";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { submitGetInTouchForm } from "../../actions";

type ServiceTypeValue = (typeof ServiceType)[keyof typeof ServiceType];

export type ServiceOption = {
  value: ServiceTypeValue;
  labelKey: TranslationKey;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  { value: ServiceType.GENERAL_INQUIRY, labelKey: "generalInquiry" },
  { value: ServiceType.RUNNING_TOURNAMENT, labelKey: "runningTournament" },
  { value: ServiceType.PRIVATE_INSTANCE, labelKey: "settingUpPrivateInstance" },
  { value: ServiceType.PRO_FORECASTING, labelKey: "proForecasting" },
  { value: ServiceType.PARTNERSHIP, labelKey: "partnership" },
];

const SERVICE_LABELS: Record<ServiceTypeValue, string> = {
  [ServiceType.RUNNING_TOURNAMENT]: "Running a Tournament",
  [ServiceType.PRIVATE_INSTANCE]: "Setting up a Private Instance",
  [ServiceType.PRO_FORECASTING]: "Pro Forecasting",
  [ServiceType.PARTNERSHIP]: "Partnership",
  [ServiceType.GENERAL_INQUIRY]: "General Inquiry",
  [ServiceType.MARKET_TIMING_AND_TRADING_SIGNALS]:
    "Market Timing and Trading Signals",
  [ServiceType.PORTFOLIO_RISK_ASSESSMENT]: "Portfolio Risk Assessment",
  [ServiceType.REGULATORY_IMPACT_ANALYSIS]: "Regulatory Impact Analysis",
  [ServiceType.CREDIT_RISK_EVALUATION]: "Credit Risk Evaluation",
  [ServiceType.MA_AND_CORPORATE_ACTIONS]: "M&A and Corporate Actions",
  [ServiceType.ECONOMIC_INDICATOR_FORECASTING]:
    "Economic Indicator Forecasting",
  [ServiceType.OTHER_FINANCIAL_FORECASTING]: "Other Financial Forecasting",
};

const contactFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().min(1, { message: "Email is required" }),
  organization: z.string().optional(),
  service: z.enum(
    Object.values(ServiceType) as [ServiceTypeValue, ...ServiceTypeValue[]],
    {
      message: "Please select a service",
    }
  ),
  message: z.string().optional(),
});

type ContactFormSchema = z.infer<typeof contactFormSchema>;

export type ContactFormProps = {
  className?: string;
  id?: string;
  preselectedService?: ServiceTypeValue;
  pageLabel?:
    | "services"
    | "tournaments"
    | "pro-forecasters"
    | "private-instances";
  serviceOptions?: ServiceOption[];
};

const ContactForm: React.FC<ContactFormProps> = ({
  className,
  id,
  preselectedService,
  pageLabel,
  serviceOptions = SERVICE_OPTIONS,
}) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  const {
    formState: { errors },
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    clearErrors,
  } = useForm<ContactFormSchema>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      service: preselectedService ?? ServiceType.GENERAL_INQUIRY,
    },
  });

  const selectedService = watch("service");

  const onSubmit = useCallback(
    async (data: ContactFormSchema) => {
      setIsLoading(true);
      setError(undefined);

      try {
        await submitGetInTouchForm({
          name: data.name,
          email: data.email,
          organization: data.organization,
          message: data.message,
          service: SERVICE_LABELS[data.service] ?? data.service,
        });

        sendAnalyticsEvent("ServiceContactForm", { event_label: pageLabel });
        reset();
      } catch (e) {
        logError(e);
        setError(e as Error & { digest?: string });
      } finally {
        setIsLoading(false);
      }
    },
    [pageLabel, reset]
  );

  const selectOptions = [
    { value: "" as unknown as ServiceTypeValue, label: "Select..." },
    ...serviceOptions.map((o) => ({ value: o.value, label: t(o.labelKey) })),
  ];

  return (
    <div className={cn("flex min-w-0 flex-1", className)} id={id}>
      <div className="w-full rounded-lg border border-gray-300 bg-gray-100 p-8 dark:border-gray-300-dark dark:bg-gray-100-dark">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-8 antialiased"
        >
          <FormField label={`${t("fullName")} *`} error={errors.name?.message}>
            <Input
              placeholder="Ada Lovelace"
              className={inputClassName}
              errors={errors.name}
              {...register("name")}
            />
          </FormField>

          <FormField
            label={`${t("emailAddress")} *`}
            error={errors.email?.message}
          >
            <Input
              type="email"
              placeholder="ada@example.com"
              className={inputClassName}
              errors={errors.email}
              {...register("email")}
            />
          </FormField>

          <FormField
            label={t("yourOrganization")}
            error={errors.organization?.message}
          >
            <Input
              placeholder="Lovelace Inc."
              className={inputClassName}
              errors={errors.organization}
              {...register("organization")}
            />
          </FormField>

          <FormField
            label={`${t("whatServiceAreYouInterestedIn")} *`}
            error={errors.service?.message}
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <FontAwesomeIcon
                  size="sm"
                  icon={faChevronDown}
                  className="text-gray-900 dark:text-gray-900-dark"
                />
              </div>

              <Select<ServiceTypeValue>
                className={cn(inputClassName, "cursor-pointer pr-12")}
                style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                value={selectedService}
                options={selectOptions}
                onChange={(e) => {
                  const v = e.target.value as ServiceTypeValue;
                  setValue("service", v);
                  clearErrors("service");
                }}
                disabled={isLoading}
              />
            </div>

            {!!errors.service && (
              <FormErrorMessage
                errors={errors.service.message}
                containerClassName="pt-2"
              />
            )}
          </FormField>

          <FormField
            label={t("yourMessageForm")}
            error={errors.message?.message}
          >
            <Textarea
              placeholder={t("tellUsAboutYourNeeds")}
              className={cn(inputClassName, "min-h-[146px] resize-none")}
              errors={errors.message}
              {...register("message")}
            />
          </FormField>

          {!isLoading && (
            <FormErrorMessage
              errors={error?.digest}
              containerClassName="text-center"
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full rounded-xl py-3 text-base leading-5"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
};

const inputClassName =
  "w-full [&+div]:-mt-2 rounded-[10px] border border-gray-300 bg-gray-0 px-4 py-3 text-sm leading-4 text-gray-900 outline-none placeholder:text-gray-600 placeholder:font-normal focus:border-gray-400 focus:ring-0 dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-900-dark dark:placeholder:text-gray-600-dark dark:focus:border-gray-400-dark";

const FormField: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, children }) => {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-sm font-medium leading-4 text-gray-800 dark:text-gray-800-dark">
        {label}
      </span>
      {children}
    </label>
  );
};

export default ContactForm;
