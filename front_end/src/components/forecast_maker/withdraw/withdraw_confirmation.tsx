import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";

import BaseModal from "../../base_modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
};

const WithdrawConfirmation: FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}) => {
  const t = useTranslations();
  return (
    <BaseModal isOpen={isOpen} onClose={() => onClose()} className="max-w-md">
      <div className="flex flex-col gap-4">
        <p className="text-center">{t("withdrawConfirmation")}</p>
        <div className="mt-2 flex justify-center gap-4">
          <Button variant="secondary" onClick={() => onClose()}>
            {t("cancel")}
          </Button>
          <Button variant="primary" onClick={onSubmit} disabled={isPending}>
            {t("withdraw")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default WithdrawConfirmation;
