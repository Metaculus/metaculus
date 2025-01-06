import { usePublisher } from "@mdxeditor/editor";
import { useTranslations } from "next-intl";
import { FC } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";

import { insertEquation$ } from "../index";

const INITIAL_EQUATION = "p = q";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const AddEquationModal: FC<Props> = ({ isOpen, onClose }) => {
  const t = useTranslations();

  const insertEquation = usePublisher(insertEquation$);

  const handleInlineClick = () => {
    insertEquation({ inline: true, equation: INITIAL_EQUATION });
    onClose();
  };

  const handleBlockClick = () => {
    insertEquation({ inline: false, equation: INITIAL_EQUATION });
    onClose();
  };

  return (
    <BaseModal
      label={t("insertEquation")}
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-xs"
    >
      <div className="flex flex-col gap-2">
        <p>{t("choseEquationType")}</p>

        <div className="flex gap-1">
          <Button
            variant="secondary"
            onClick={handleInlineClick}
            className="flex-1"
          >
            {t("inline")}
          </Button>
          <Button
            variant="secondary"
            onClick={handleBlockClick}
            className="flex-1"
          >
            {t("block")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default AddEquationModal;
