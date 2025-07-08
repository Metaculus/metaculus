import { faCircleCheck } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, MouseEventHandler } from "react";

import useCardReaffirmContext from "@/components/post_card/reaffirm_context";
import LoadingSpinner from "@/components/ui/loading_spiner";
import cn from "@/utils/core/cn";

type Props = {
  onClick: MouseEventHandler<HTMLButtonElement>;
  all?: boolean;
  className?: string;
};

const ReaffirmButton: FC<Props> = ({ onClick, all = false, className }) => {
  const t = useTranslations();
  const { reaffirmStatus } = useCardReaffirmContext();

  const ReaffirmElement = (
    <span className={cn("inline-flex items-center gap-1")}>
      <span>{all ? t("reaffirmAll") : t("reaffirm")}</span>
      {reaffirmStatus === "loading" && <LoadingSpinner size="sm" />}
      {reaffirmStatus === "completed" && (
        <FontAwesomeIcon icon={faCircleCheck} size="sm" />
      )}
    </span>
  );

  return (
    <button
      className={cn(
        "rounded-full border border-orange-700 px-2 py-0.5 text-orange-700 hover:border-orange-600 hover:text-orange-600 dark:border-orange-700-dark dark:text-orange-700-dark dark:hover:border-orange-600-dark dark:hover:text-orange-600-dark",
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
