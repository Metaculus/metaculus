"use client";

import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UseFormReturn } from "react-hook-form";

import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";

type Props = {
  isLive: boolean;
  mode: "create" | "edit";
  control: UseFormReturn<{
    condition_id: string | undefined;
    condition_child_id: string | undefined;
    default_project: number | null;
  }>;
  setConditionQuestion: () => void;
  fieldName: "condition_id" | "condition_child_id";
};

const ConditionalQuestionInput: React.FC<Props> = ({
  isLive,
  mode,
  control,
  setConditionQuestion,
  fieldName,
}) => {
  return (
    <div className="relative m-auto w-full flex-col">
      <Input
        readOnly={isLive && mode !== "create"}
        className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
        {...control.register(fieldName)}
        onChange={(e) => control.setValue(fieldName, e.target.value)}
        errors={control.formState.errors[fieldName]}
      />
      <Button
        variant="text"
        onClick={setConditionQuestion}
        className="absolute inset-y-0 right-0 inline-flex h-[42px] justify-center pr-2"
        aria-label="Search"
      >
        <FontAwesomeIcon icon={faAdd} size="lg" className="text-gray-500" />
      </Button>
    </div>
  );
};

export default ConditionalQuestionInput;
