import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { ErrorResponse } from "@/types/fetch";

type Props = {
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled: boolean;
  errors?: ErrorResponse;
};

const KeyFactorsModalFooter: React.FC<Props> = ({
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
  disabled,
  errors,
}) => (
  <div
    className={[
      "sticky -bottom-5 z-10 -mb-5 mt-auto sm:mb-0 sm:mt-0",
      "-mx-5 px-5 py-3 md:-mx-7 md:px-7 md:pb-0 md:pt-6",
      "border-t border-blue-400 dark:border-blue-400-dark",
      "bg-gray-0/80 backdrop-blur supports-[backdrop-filter]:bg-gray-0/60",
      "dark:bg-gray-0-dark/80 dark:supports-[backdrop-filter]:bg-gray-0-dark/60",
      "sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-0",
    ].join(" ")}
  >
    <div className="mt-0 flex w-full gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={onCancel}
        className="ml-auto"
        disabled={isPending}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onSubmit}
        disabled={isPending || disabled}
      >
        {submitLabel}
      </Button>
    </div>
    <FormError errors={errors} detached />
  </div>
);

export default KeyFactorsModalFooter;
