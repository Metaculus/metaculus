"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { FormErrorMessage, Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

const getInTouchFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().min(1, { message: "Email is required" }),
  organization: z.string().min(1, { message: "Organization is required" }),
  runingTournament: z.boolean().optional(),
  privateInstance: z.boolean().optional(),
  partnership: z.boolean().optional(),
  generalInquiry: z.boolean().optional(),
  proForecasting: z.boolean().optional(),
});
type GetInTouchFormchema = z.infer<typeof getInTouchFormSchema>;

type Props = {
  className?: string;
};

const GetInTouchForm: FC<Props> = ({ className }) => {
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
    getValues,
  } = useForm<GetInTouchFormchema>({
    resolver: zodResolver(getInTouchFormSchema),
  });

  const onSubmit = useCallback(async (data: GetInTouchFormchema) => {
    setIsLoading(true);
    setError(undefined);
    console.log(data);
    try {
      // TODO: integrate new endpoint
      console.log(data);
    } catch (e) {
      logError(e);
      const error = e as Error & { digest?: string };
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-2xl bg-gray-0 px-8 py-11 dark:bg-gray-0-dark sm:px-16 sm:py-14 md:py-[74px] lg:py-16",
        className
      )}
    >
      <h3 className="m-0 w-full text-start text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark lg:text-center">
        {t("getInTouch")}
      </h3>
      <p className="m-0 mt-3 w-full text-start text-base leading-tight text-blue-700 dark:text-blue-700-dark lg:text-center lg:text-xl">
        {t("learnAboutPotentialWaysToWorkWithUs")}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)();
          console.log(errors);
          console.log(getValues());
        }}
        className="mt-2.5 flex w-full flex-col gap-[21px] lg:mt-10 lg:items-center"
      >
        <div className="flex w-full flex-col gap-5 lg:flex-row">
          <label className="flex w-full flex-col gap-2">
            <span className="text-sm font-bold text-blue-700 dark:text-blue-700-dark lg:text-lg">
              {t("yourName")}:
            </span>
            <Input
              className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              type="text"
              errors={errors.name}
              {...register("name")}
            />
          </label>

          <label className="flex w-full flex-col gap-2">
            <span className="text-sm font-bold text-blue-700 dark:text-blue-700-dark lg:text-lg">
              {t("emailAddress")}:
            </span>
            <Input
              className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              type="email"
              errors={errors.email}
              {...register("email")}
            />
          </label>

          <label className="flex w-full flex-col gap-2">
            <span className="text-sm font-bold text-blue-700 dark:text-blue-700-dark lg:text-lg">
              {t("organization")}:
            </span>
            <Input
              className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              type="text"
              errors={errors.organization}
              {...register("organization")}
            />
          </label>
        </div>
        <div className="lg:mt-2.5">
          <p className="m-0 text-center text-sm font-bold text-blue-700 dark:text-blue-700-dark lg:text-lg">
            {t("whatServiceAreYouInterestedIn")}
          </p>
          <div className="mt-3 flex max-w-[600px] flex-wrap items-center justify-center gap-x-5 gap-y-3 text-blue-800 dark:text-blue-800-dark lg:mt-5">
            <Controller
              name="runingTournament"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("runningTournament")}
                  className="inline-flex items-center lg:order-2"
                  inputClassName="w-4 h-4 flex"
                />
              )}
            />
            <Controller
              name="privateInstance"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("settingUpPrivateInstance")}
                  className="inline-flex items-center lg:order-3"
                  inputClassName="w-4 h-4 flex"
                />
              )}
            />
            <Controller
              name="partnership"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("partnership")}
                  className="inline-flex items-center lg:order-5"
                  inputClassName="w-4 h-4 flex"
                />
              )}
            />
            <Controller
              name="generalInquiry"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("generalInquiry")}
                  className="inline-flex items-center lg:order-1"
                  inputClassName="w-4 h-4 flex"
                />
              )}
            />
            <Controller
              name="proForecasting"
              control={control}
              render={({ field }) => (
                <Checkbox
                  {...field}
                  label={t("proForecasting")}
                  className="inline-flex items-center lg:order-4"
                  inputClassName="w-4 h-4 flex"
                />
              )}
            />
          </div>
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

export default GetInTouchForm;
