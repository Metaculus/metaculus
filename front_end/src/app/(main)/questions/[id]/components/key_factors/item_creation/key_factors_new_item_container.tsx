import { faCog, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

import Button from "@/components/ui/button";

type Props = PropsWithChildren<{
  showDeleteButton: boolean;
  onDeleteButtonClick: () => void;
}>;

const KeyFactorsNewItemContainer: React.FC<Props> = ({
  showDeleteButton,
  onDeleteButtonClick,
  children,
}) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-3 rounded border border-blue-500 bg-blue-100 px-5 py-4 dark:border-blue-500-dark dark:bg-blue-100-dark">
      <div className="flex justify-between">
        <div className="flex items-center gap-2 text-xs text-blue-700 opacity-50 dark:text-blue-700-dark">
          <FontAwesomeIcon icon={faCog} />
          <span className="uppercase">{t("driver")}</span>
        </div>
        {showDeleteButton && (
          <Button variant="link" onClick={onDeleteButtonClick}>
            <FontAwesomeIcon
              icon={faXmark}
              className="size-4 text-salmon-600 dark:text-salmon-600-dark"
            />
          </Button>
        )}
      </div>
      {children}
    </div>
  );
};

export default KeyFactorsNewItemContainer;
