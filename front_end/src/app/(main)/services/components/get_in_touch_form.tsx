"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";
import { useForm, Controller, UseFormRegister } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/ui/button";
import { FormErrorMessage, Input, Textarea } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { ServiceType } from "@/constants/services";
import { ErrorResponse } from "@/types/fetch";
import { TranslationKey } from "@/types/translations";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import Checkbox from "./get_in_touch_checkbox";
import { submitGetInTouchForm } from "../actions";

type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];
type ServiceOption = {
  value: ServiceType;
  labelKey: TranslationKey;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    value: ServiceType.GENERAL_INQUIRY,
    labelKey: "generalInquiry",
  },
  {
    value: ServiceType.RUNNING_TOURNAMENT,
    labelKey: "runningTournament",
  },
  {
    value: ServiceType.PRIVATE_INSTANCE,
    labelKey: "settingUpPrivateInstance",
  },
  {
    value: ServiceType.PRO_FORECASTING,
    labelKey: "proForecasting",
  },
  {
    value: ServiceType.PARTNERSHIP,
    labelKey: "partnership",
  },
];

const getInTouchFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().min(1, { message: "Email is required" }),
  organization: z.string().optional(),
  message: z.string().optional(),
  services: z
    .array(
      z.enum([
        ServiceType.RUNNING_TOURNAMENT,
        ServiceType.PRIVATE_INSTANCE,
        ServiceType.PARTNERSHIP,
        ServiceType.GENERAL_INQUIRY,
        ServiceType.PRO_FORECASTING,
      ])
    )
    .min(1, { message: "At least one service must be selected" }),
});
type GetInTouchFormSchema = z.infer<typeof getInTouchFormSchema>;

type Props = {
  className?: string;
  id?: string;
  preselectedServices?: ServiceType[];
};

const GetInTouchForm: FC<Props> = ({ className, id, preselectedServices }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  const {
    formState: { errors },
    register,
    handleSubmit,
    control,
    reset,
    clearErrors,
  } = useForm<GetInTouchFormSchema>({
    resolver: zodResolver(getInTouchFormSchema),
    defaultValues: {
      services: preselectedServices ?? [],
    },
  });

  const onSubmit = useCallback(
    async (data: GetInTouchFormSchema) => {
      setIsLoading(true);
      setError(undefined);
      const { services, ...formData } = data;
      const serviceString = getServiceString(services);

      try {
        await submitGetInTouchForm({
          ...formData,
          service: serviceString,
        });
        sendAnalyticsEvent("ServiceContactForm");
        reset();
      } catch (e) {
        logError(e);
        const error = e as Error & { digest?: string };
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [reset]
  );

  return (
    <div
      className={cn(
        "flex w-full scroll-m-16 flex-col items-center justify-center rounded-2xl bg-gray-0 px-8 py-11 dark:bg-gray-0-dark sm:px-16 sm:py-14 md:py-[74px] lg:py-16",
        className
      )}
      id={id}
    >
      <h3 className="m-0 w-full text-start text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark lg:text-center">
        {t("getInTouch")}
      </h3>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex w-full flex-col gap-[21px] lg:mt-10 lg:items-center"
      >
        <div className="flex w-full flex-col gap-y-6 lg:flex-row lg:gap-x-8">
          <div className="flex w-full flex-col gap-5">
            <FormInput
              label={t("yourName")}
              errors={errors.name}
              register={register}
              name="name"
            />
            <FormInput
              label={t("emailAddress")}
              errors={errors.email}
              register={register}
              name="email"
              type="email"
            />

            <FormInput
              label={t("organization")}
              errors={errors.organization}
              register={register}
              name="organization"
            />

            <FormInput
              label={t("yourMessageOptional")}
              errors={errors.message}
              register={register}
              name="message"
              className="lg:h-24"
              isTextarea
            />
          </div>
          <div className="relative w-full lg:mt-auto">
            <p className="m-0 text-pretty text-center text-lg font-medium text-blue-700 dark:text-blue-700-dark lg:mt-auto lg:text-start">
              {t("whatServiceAreYouInterestedIn")}
            </p>
            <div className="mx-auto mt-4 flex flex-col items-center justify-center gap-y-3 text-blue-800 dark:text-blue-800-dark lg:mt-3">
              {SERVICE_OPTIONS.map((serviceOption) => (
                <Controller
                  key={serviceOption.value}
                  name="services"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label={t(serviceOption.labelKey)}
                      className="flex w-full"
                      inputClassName="w-4 h-4 flex mr-3"
                      checked={field.value?.includes(serviceOption.value)}
                      onChange={(checked) => {
                        if (checked) {
                          clearErrors("services");
                          field.onChange([
                            ...(field.value || []),
                            serviceOption.value,
                          ]);
                        } else {
                          field.onChange(
                            (field.value || []).filter(
                              (v) => v !== serviceOption.value
                            )
                          );
                        }
                      }}
                    />
                  )}
                />
              ))}
            </div>
            {!!errors.services && (
              <FormErrorMessage
                containerClassName="w-full absolute top-full flex justify-center py-1.5"
                errors={errors.services}
              />
            )}
          </div>
        </div>
        {!isLoading && (
          <FormErrorMessage
            errors={error?.digest}
            containerClassName="text-center"
          />
        )}
        <Button
          variant="primary"
          type="submit"
          size="lg"
          className="mx-auto mt-2.5"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : t("submit")}
        </Button>
      </form>
    </div>
  );
};

type FormInputProps = {
  label: string;
  errors?: ErrorResponse;
  register: UseFormRegister<any>;
  name: string;
  type?: "text" | "email";
  isTextarea?: boolean;
  className?: string;
};

const FormInput: FC<FormInputProps> = ({
  label,
  errors,
  register,
  name,
  type = "text",
  isTextarea = false,
  className,
}) => {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-sm font-normal text-blue-700 dark:text-blue-700-dark lg:text-base">
        {label}
      </span>
      <div>
        {isTextarea ? (
          <Textarea
            className={cn(
              "block w-full resize-none rounded border border-gray-400 bg-inherit px-3 py-2 outline-none focus:border-gray-700 dark:border-gray-400-dark dark:focus:border-gray-700-dark",
              className
            )}
            type={type}
            errors={errors}
            {...register(name)}
          />
        ) : (
          <Input
            className={cn(
              "block w-full rounded border border-gray-400 bg-inherit px-3 py-[9px] outline-none focus:border-gray-700 dark:border-gray-400-dark dark:focus:border-gray-700-dark",
              className
            )}
            type={type}
            errors={errors}
            {...register(name)}
          />
        )}
      </div>
    </label>
  );
};

const SERVICE_LABELS = {
  [ServiceType.RUNNING_TOURNAMENT]: "Running a Tournament",
  [ServiceType.PRIVATE_INSTANCE]: "Setting up a Private Instance",
  [ServiceType.PRO_FORECASTING]: "Pro Forecasting",
  [ServiceType.PARTNERSHIP]: "Partnership",
  [ServiceType.GENERAL_INQUIRY]: "General Inquiry",
} as const;

function getServiceString(services: ServiceType[]) {
  return services.map((service) => SERVICE_LABELS[service]).join(", ");
}

export default GetInTouchForm;
