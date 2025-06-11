"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";
import { useForm, Controller, UseFormRegister } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { FormError, FormErrorMessage, Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { ErrorResponse } from "@/types/fetch";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { submitGetInTouchForm } from "../actions";

const ServiceType = {
  RUNNING_TOURNAMENT: "running_tournament",
  PRIVATE_INSTANCE: "private_instance",
  PARTNERSHIP: "partnership",
  GENERAL_INQUIRY: "general_inquiry",
  PRO_FORECASTING: "pro_forecasting",
} as const;

type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

const getInTouchFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().min(1, { message: "Email is required" }),
  organization: z.string().min(1, { message: "Organization is required" }),
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
type GetInTouchFormchema = z.infer<typeof getInTouchFormSchema>;

type Props = {
  className?: string;
  id?: string;
};

const GetInTouchForm: FC<Props> = ({ className, id }) => {
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
  } = useForm<GetInTouchFormchema>({
    resolver: zodResolver(getInTouchFormSchema),
    defaultValues: {
      services: [],
    },
  });

  const onSubmit = useCallback(
    async (data: GetInTouchFormchema) => {
      setIsLoading(true);
      setError(undefined);
      const { name, email, organization } = data;
      const serviceString = getServiceString(data);
      try {
        await submitGetInTouchForm({
          name,
          email,
          organization,
          service: serviceString,
        });
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
      <p className="m-0 mt-3 w-full text-start text-base leading-tight text-blue-700 dark:text-blue-700-dark lg:text-center lg:text-xl">
        {t("learnAboutPotentialWaysToWorkWithUs")}
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-2.5 flex w-full flex-col gap-[21px] lg:mt-10 lg:items-center"
      >
        <div className="flex w-full flex-col gap-5 lg:flex-row">
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
        </div>
        <div className="lg:mt-2.5">
          <p className="m-0 text-center text-sm font-bold text-blue-700 dark:text-blue-700-dark lg:text-lg">
            {t("whatServiceAreYouInterestedIn")}
          </p>
          <div className="mx-auto mt-3 flex max-w-[600px] flex-wrap items-center justify-center gap-x-5 gap-y-3 text-blue-800 dark:text-blue-800-dark lg:mt-5">
            <Controller
              name="services"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("runningTournament")}
                  className="inline-flex items-center lg:order-2"
                  inputClassName="w-4 h-4 flex"
                  checked={field.value?.includes(
                    ServiceType.RUNNING_TOURNAMENT
                  )}
                  onChange={(checked) => {
                    field.onChange(
                      checked
                        ? [
                            ...(field.value || []),
                            ServiceType.RUNNING_TOURNAMENT,
                          ]
                        : (field.value || []).filter(
                            (v) => v !== ServiceType.RUNNING_TOURNAMENT
                          )
                    );
                  }}
                />
              )}
            />
            <Controller
              name="services"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("settingUpPrivateInstance")}
                  className="inline-flex items-center lg:order-3"
                  inputClassName="w-4 h-4 flex"
                  checked={field.value?.includes(ServiceType.PRIVATE_INSTANCE)}
                  onChange={(checked) => {
                    field.onChange(
                      checked
                        ? [...(field.value || []), ServiceType.PRIVATE_INSTANCE]
                        : (field.value || []).filter(
                            (v) => v !== ServiceType.PRIVATE_INSTANCE
                          )
                    );
                  }}
                />
              )}
            />
            <Controller
              name="services"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("proForecasting")}
                  className="inline-flex items-center lg:order-4"
                  inputClassName="w-4 h-4 flex"
                  checked={field.value?.includes(ServiceType.PRO_FORECASTING)}
                  onChange={(checked) => {
                    field.onChange(
                      checked
                        ? [...(field.value || []), ServiceType.PRO_FORECASTING]
                        : (field.value || []).filter(
                            (v) => v !== ServiceType.PRO_FORECASTING
                          )
                    );
                  }}
                />
              )}
            />
            <Controller
              name="services"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("partnership")}
                  className="inline-flex items-center lg:order-5"
                  inputClassName="w-4 h-4 flex"
                  checked={field.value?.includes(ServiceType.PARTNERSHIP)}
                  onChange={(checked) => {
                    field.onChange(
                      checked
                        ? [...(field.value || []), ServiceType.PARTNERSHIP]
                        : (field.value || []).filter(
                            (v) => v !== ServiceType.PARTNERSHIP
                          )
                    );
                  }}
                />
              )}
            />
            <Controller
              name="services"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("generalInquiry")}
                  className="inline-flex items-center lg:order-1"
                  inputClassName="w-4 h-4 flex"
                  checked={field.value?.includes(ServiceType.GENERAL_INQUIRY)}
                  onChange={(checked) => {
                    field.onChange(
                      checked
                        ? [...(field.value || []), ServiceType.GENERAL_INQUIRY]
                        : (field.value || []).filter(
                            (v) => v !== ServiceType.GENERAL_INQUIRY
                          )
                    );
                  }}
                />
              )}
            />
          </div>
          <FormError errors={errors} name="services" />
          {!isLoading && <FormErrorMessage errors={error?.digest} />}
        </div>
        <Button
          variant="primary"
          type="submit"
          size="lg"
          className="mx-auto lg:mt-2.5"
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
};

const FormInput: FC<FormInputProps> = ({
  label,
  errors,
  register,
  name,
  type = "text",
}) => {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-sm font-bold text-blue-700 dark:text-blue-700-dark lg:text-lg">
        {label}:
      </span>
      <Input
        className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
        type={type}
        errors={errors}
        {...register(name)}
      />
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

function getServiceString(data: GetInTouchFormchema) {
  return data.services.map((service) => SERVICE_LABELS[service]).join(", ");
}

export default GetInTouchForm;
