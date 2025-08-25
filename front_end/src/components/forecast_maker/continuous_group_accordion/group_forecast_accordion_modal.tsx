import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, PropsWithChildren } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type MobileAccordionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
};

const MobileAccordionModal: FC<
  PropsWithChildren<MobileAccordionModalProps>
> = ({ isOpen, onClose, title, className, children }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      isImmersive={true}
      dialogClassName="z-[201]"
      className={cn(
        "m-0 h-full w-full max-w-none overscroll-contain rounded-none p-0 lg:hidden",
        className
      )}
    >
      <div className={"flex h-full flex-col bg-white dark:bg-blue-200-dark"}>
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-xl font-medium leading-7">{title}</h2>
          <Button
            onClick={() => onClose()}
            className="rounded-full border border-blue-400 bg-blue-100 p-2 dark:border-blue-400-dark dark:bg-blue-100-dark"
          >
            <FontAwesomeIcon
              icon={faXmark}
              className="h-4 w-4 text-blue-700 dark:text-blue-700-dark"
            />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pt-0">{children}</div>
      </div>
    </BaseModal>
  );
};

export default MobileAccordionModal;
