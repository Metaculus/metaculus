"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { submitContactForm } from "@/app/(main)/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import {
  FormError,
  FormErrorMessage,
  Input,
  Textarea,
} from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Select from "@/components/ui/select";
import { ContactSubject, ContactSubjectType } from "@/constants/contact";
import { useAuth } from "@/contexts/auth_context";
import { logError } from "@/utils/core/errors";

const contactUsSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }),
  subject: z.nativeEnum(ContactSubject, {
    errorMap: () => ({ message: "Subject is required" }),
  }),
  message: z.string().min(1, { message: "Message is required" }),
});
type ContactUsSchema = z.infer<typeof contactUsSchema>;

type Props = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  defaultSubject?: ContactSubjectType;
};

const ContactUsModal: FC<Props> = ({ isOpen, onClose, defaultSubject }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const { user } = useAuth();

  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm<ContactUsSchema>({
    defaultValues: {
      subject: defaultSubject,
      email: user?.email,
    },
    resolver: zodResolver(contactUsSchema),
  });

  const onSubmit = useCallback(
    async (data: ContactUsSchema) => {
      setIsLoading(true);
      setError(undefined);
      try {
        // use form data to send request to the email api
        await submitContactForm({
          ...data,
          source_url:
            typeof window !== "undefined"
              ? window.location.origin + window.location.pathname
              : undefined,
        });
        onClose(false);
        setIsSuccessModalOpen(true);
      } catch (e) {
        logError(e);
        const error = e as Error & { digest?: string };
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [onClose]
  );

  const subjectOptions: { value: ContactSubjectType; label: string }[] = [
    {
      value: ContactSubject.PARTNERSHIP,
      label: t("contactSubjectPartnership"),
    },
    { value: ContactSubject.FEEDBACK, label: t("contactSubjectFeedback") },
    { value: ContactSubject.BUG, label: t("contactSubjectBug") },
    { value: ContactSubject.FEATURE, label: t("contactSubjectFeature") },
    { value: ContactSubject.PRESS, label: t("contactSubjectPress") },
    { value: ContactSubject.OTHER, label: t("contactSubjectOther") },
  ];

  return (
    <>
      <BaseModal
        className="max-w-xl overflow-y-auto"
        label={t("contactUs")}
        isOpen={isOpen}
        onClose={onClose}
      >
        <div className="max-h-full w-full">
          <p className="my-6 text-base leading-tight">
            {t("reachOutToLearnMore")}
          </p>
          <p className="mb-6 mt-3 text-base leading-tight">
            {t("feelFreeToJustSayHello")}
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              className="mt-4 block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              placeholder={t("yourEmail")}
              type="email"
              errors={errors.email}
              {...register("email")}
            />

            <div>
              <Select
                className="select-arrow mt-4 h-8 w-full rounded border border-gray-700 bg-inherit bg-[length:22px_20%] bg-no-repeat px-3 text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
                {...register("subject")}
                options={[
                  { value: "", label: t("selectReason"), disabled: true },
                  ...subjectOptions.map(({ value, label }) => ({
                    value,
                    label,
                    className: "text-gray-900",
                  })),
                ]}
              ></Select>
              {errors.subject && (
                <FormError errors={errors.subject} name={"subject"} />
              )}
            </div>

            <Textarea
              className="mt-4 block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              placeholder={t("yourMessage")}
              rows={5}
              errors={errors.message}
              {...register("message")}
            />

            <div className="mt-4 text-right">
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
      </BaseModal>
      <BaseModal
        className="max-w-xl overflow-y-auto"
        label={t("contactUs")}
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      >
        <div className="max-h-full w-full">
          <p className="my-6 text-base leading-tight">
            {t("thankYouForGettingInTouch")}
          </p>
        </div>
      </BaseModal>
    </>
  );
};

export default ContactUsModal;
