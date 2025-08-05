import { FC, PropsWithChildren } from "react";

import Button from "@/components/ui/button";

import WithdrawConfirmation from "./withdraw_confirmation";

type Props = PropsWithChildren<{
  type?: "submit" | "button";
  isPromptOpen: boolean;
  onPromptVisibilityChange: (isOpen: boolean) => void;
  onSubmit: () => void;
  isPending: boolean;
}>;

const WithdrawButton: FC<Props> = ({
  type = "submit",
  isPromptOpen,
  onPromptVisibilityChange,
  onSubmit,
  isPending,
  children,
}) => {
  return (
    <>
      <Button
        variant="secondary"
        type={type}
        disabled={isPending}
        onClick={() => onPromptVisibilityChange(true)}
      >
        {children}
      </Button>
      <WithdrawConfirmation
        isOpen={isPromptOpen}
        onClose={() => onPromptVisibilityChange(false)}
        onSubmit={onSubmit}
        isPending={isPending}
      />
    </>
  );
};

export default WithdrawButton;
