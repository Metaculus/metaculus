"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { FormError, FormErrorMessage, Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useAuth } from "@/contexts/auth_context";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

const contactFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().min(1, { message: "Email is required" }),
  organization: z.string().min(1, { message: "Organization is required" }),
  runingTournament: z.boolean().optional(),
  privateInstance: z.boolean().optional(),
  partnership: z.boolean().optional(),
  generalInquiry: z.boolean().optional(),
});
type ContactFormSchema = z.infer<typeof contactFormSchema>;

type Props = {
  className?: string;
};

const ContactForm: FC<Props> = ({ className }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const { user } = useAuth();

  const {
    formState: { errors },
    register,
    handleSubmit,
    control,
    getValues,
  } = useForm<ContactFormSchema>({
    defaultValues: {
      email: user?.email,
    },
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = useCallback(async (data: ContactFormSchema) => {
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
        "flex w-full flex-col items-center justify-center rounded-2xl bg-gray-0 px-8 py-11 dark:bg-gray-0-dark",
        className
      )}
    >
      <h3 className="m-0 text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark">
        {t("getInTouch")}
      </h3>
      <p className="my-6 text-base leading-tight">
        {t("learnAboutPotentialWaysToWorkWithUs")}
      </p>
      <form
        onSubmit={() => {
          handleSubmit(onSubmit)();
          console.log(errors);
          console.log(getValues());
        }}
        className="flex w-full flex-col gap-[21px]"
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-700-dark">
            {t("yourName")}:
          </span>
          <Input
            className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
            type="text"
            errors={errors.name}
            {...register("name")}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-700-dark">
            {t("emailAddress")}:
          </span>
          <Input
            className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
            type="email"
            errors={errors.email}
            {...register("email")}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-700-dark">
            {t("organization")}:
          </span>
          <Input
            className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
            type="text"
            errors={errors.organization}
            {...register("organization")}
          />
        </label>
        <p className="text-sm font-bold text-blue-700 dark:text-blue-700-dark">
          {t("whatServiceAreYouInterestedIn")}:
        </p>
        <div className="flex flex-col gap-2">
          <Controller
            name="runingTournament"
            control={control}
            render={({ field }) => (
              <Checkbox {...field} label={t("runningTournament")} />
            )}
          />
        </div>
        <div className="mt-4 text-center">
          {!isLoading && <FormErrorMessage errors={error?.digest} />}
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
            className="mt-1"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
