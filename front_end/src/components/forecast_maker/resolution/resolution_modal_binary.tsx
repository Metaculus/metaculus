"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { inviteProjectUsers } from "@/app/(main)/tournaments/[slug]/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import { useAuth } from "@/contexts/auth_context";
import { ErrorResponse } from "@/types/fetch";
import { QuestionWithNumericForecasts } from "@/types/question";

type Props = {
  question: QuestionWithNumericForecasts;
};

const schema = z.object({
  resolutionType: z.string(),
});
type FormData = z.infer<typeof schema>;

const QuestionResolutionModal: FC<Props> = ({ question }) => {
  const t = useTranslations();
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleSubmit, register, reset, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = useCallback(
    async ({ resolutionType }: FormData) => {
      console.log("RESOLUTION TYPE", resolutionType);

      setSubmitErrors([]);

      setIsSubmitting(true);

      const responses = null;

      setIsSubmitting(false);

      /*
      if (responses && "errors" in responses && !!responses.errors) {
        setSubmitErrors(responses.errors);
      } else {
        reset();
      }
       */
    },
    [reset]
  );

  console.log("FORM STATE", formState);

  return (
    <BaseModal isOpen={true} onClose={() => {}} variant="dark">
      <div className="max-w-xl flex-col items-center text-center">
        <h3 className="mb-4 text-white">{question.title}</h3>
        <p className="mb-3">What is the resolution?</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Select
              {...register("resolutionType")}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "ambiguous", label: "Ambiguous" },
                { value: "annulled", label: "Annulled" },
              ]}
            />
          </div>
          <p>
            Notifications will be sent in 10 minutes (at Jun 27, 2024, 8:32 PM).
            If this question is unresolved before then, no notification will be
            sent.
          </p>
          <div>
            <Button variant="bright" type="submit" size="lg">
              {t("resolveButton")}
            </Button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default QuestionResolutionModal;
