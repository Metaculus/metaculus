import { DisclosureButton } from "@headlessui/react";
import { FC, PropsWithChildren } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Props = {
  onClick: () => void;
  open: boolean;
  isDirty?: boolean;
  isResolved?: boolean;
};

const AccordionOpenButton: FC<PropsWithChildren<Props>> = ({
  onClick,
  open,
  isDirty,
  isResolved,
  children,
}) => {
  return (
    <>
      {/* Mobile button */}
      <Button
        className={cn(
          "flex h-[58px] w-full gap-0.5 rounded-none bg-blue-100 p-0 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark sm:hidden",
          open && "sm:bg-blue-600/10 dark:sm:bg-blue-400/10",
          !isResolved && isDirty && "bg-orange-100 dark:bg-orange-100-dark"
        )}
        onClick={onClick}
        variant="text"
      >
        {children}
      </Button>
      {/* Desktop button */}
      <DisclosureButton
        className={cn(
          "hidden h-[58px] w-full gap-0.5 bg-blue-100 text-left text-xs font-bold text-blue-700 dark:bg-blue-100-dark dark:text-blue-700-dark sm:flex",
          open && "bg-blue-600/10 dark:bg-blue-400/10",
          !isResolved && isDirty && "bg-orange-100 dark:bg-orange-100-dark"
        )}
      >
        {children}
      </DisclosureButton>
    </>
  );
};

export { AccordionOpenButton };
