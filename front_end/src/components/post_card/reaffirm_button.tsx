import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, MouseEventHandler } from "react";

import useCardReaffirmContext from "@/components/post_card/reaffirm_context";
import LoadingSpinner from "@/components/ui/loading_spiner";
import cn from "@/utils/core/cn";

type Props = {
  onClick: MouseEventHandler<HTMLButtonElement>;
  combined?: boolean;
  className?: string;
};

const ReaffirmButton: FC<Props> = ({
  onClick,
  combined = false,
  className,
}) => {
  const t = useTranslations();
  const { reaffirmStatus } = useCardReaffirmContext();

  const ReaffirmElement = (
    <span
      className={cn("inline-flex items-center gap-1 underline", {
        lowercase: combined,
      })}
    >
      {combined && "("}
      {t("reaffirm")}
      {reaffirmStatus === "loading" && <LoadingSpinner size="sm" />}
      {reaffirmStatus === "completed" && (
        <FontAwesomeIcon icon={faCircleCheck} size="sm" />
      )}
      {combined && ")"}
    </span>
  );

  return (
    <button
      className={cn(
        "text-orange-800 hover:text-orange-600 dark:text-orange-800-dark dark:hover:text-orange-600-dark",
        className
      )}
      onClick={(e) => {
        // prevent navigation, e.g. when rendered inside Next.js Link
        e.stopPropagation();
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopImmediatePropagation();

        onClick(e);
      }}
    >
      {ReaffirmElement}
    </button>
  );
};

export default ReaffirmButton;
