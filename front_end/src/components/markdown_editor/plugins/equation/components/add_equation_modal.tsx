import { zodResolver } from "@hookform/resolvers/zod";
import { activeEditor$, useCellValue, usePublisher } from "@mdxeditor/editor";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Input, Textarea } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";

import KatexRenderer from "../../../../katex_renderer";
import { insertEquation$ } from "../index";

const createSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    inline: z.boolean(),
    equation: z.string().min(1, {
      message: t("errorMinLength", { field: "String", minLength: 1 }),
    }),
  });
type FormValues = z.infer<ReturnType<typeof createSchema>>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const AddEquationModal: FC<Props> = ({ isOpen, onClose }) => {
  const t = useTranslations();

  const editor = useCellValue(activeEditor$);
  const insertEquation = usePublisher(insertEquation$);

  const { register, control, watch, formState, reset, handleSubmit } =
    useForm<FormValues>({
      mode: "all",
      resolver: zodResolver(createSchema(t)),
      defaultValues: {
        inline: true,
        equation: "",
      },
    });

  const equation = watch("equation");
  const inline = watch("inline");

  const closeModal = () => {
    reset();
    onClose();
  };

  const handleValidSubmit = (data: FormValues) => {
    insertEquation(data);
    closeModal();
  };

  return (
    <BaseModal
      label={t("insertEquation")}
      isOpen={isOpen}
      onClose={closeModal}
      className="w-full max-w-xs"
    >
      <div className="flex flex-col gap-2">
        <Controller
          control={control}
          name={"inline"}
          render={({ field }) => (
            <Checkbox
              label="Inline"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <InputContainer labelText={t("equation")}>
          {inline ? (
            <Input
              {...register("equation")}
              errors={formState.errors.equation}
            />
          ) : (
            <Textarea
              {...register("equation")}
              errors={formState.errors.equation}
            />
          )}
        </InputContainer>
        <InputContainer labelText={t("visualization")}>
          <div className="flex items-center justify-center">
            <ErrorBoundary onError={(e) => editor?._onError(e)} fallback={null}>
              <KatexRenderer equation={equation} inline={false} />
            </ErrorBoundary>
          </div>
        </InputContainer>

        <Button
          variant="primary"
          type="submit"
          className="self-center"
          onClick={handleSubmit(handleValidSubmit)}
        >
          {t("confirm")}
        </Button>
      </div>
    </BaseModal>
  );
};

export default AddEquationModal;
