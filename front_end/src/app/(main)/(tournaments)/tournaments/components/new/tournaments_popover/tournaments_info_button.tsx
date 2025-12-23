import { useFloating } from "@floating-ui/react";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClick?: () => void;
  refs?: ReturnType<typeof useFloating>["refs"];
  getReferenceProps?: (
    userProps?: React.HTMLProps<Element>
  ) => Record<string, unknown>;
  disabled?: boolean;
};

const TournamentsInfoButton: React.FC<Props> = ({
  isOpen,
  onClick,
  refs,
  disabled,
  getReferenceProps,
}) => {
  const t = useTranslations();

  return (
    <Button
      ref={refs?.setReference}
      presentationType="icon"
      size="md"
      variant={isOpen ? "primary" : "tertiary"}
      aria-label={t("tournamentsInfoAria")}
      aria-pressed={isOpen}
      disabled={disabled}
      className="h-9 w-9 border-[1px] border-blue-400 text-lg dark:border-blue-400-dark"
      onClick={onClick}
      {...getReferenceProps?.()}
    >
      ?
    </Button>
  );
};

export default TournamentsInfoButton;
