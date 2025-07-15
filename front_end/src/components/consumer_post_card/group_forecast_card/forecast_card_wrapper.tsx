import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

type Props = {
  otherItemsCount: number;
};

const ForecastCardWrapper: FC<PropsWithChildren<Props>> = ({
  otherItemsCount,
  children,
}) => {
  const t = useTranslations();
  return (
    <div className="flex w-full flex-col gap-2">
      {children}
      {otherItemsCount > 0 && (
        <div className="flex flex-row items-center gap-2 rounded-lg border border-gray-300 px-2.5 py-1 font-medium text-gray-500 dark:border-gray-300-dark dark:text-gray-500-dark">
          <div className="self-center text-center">
            <FontAwesomeIcon
              icon={faEllipsis}
              size="xl"
              className="resize-ellipsis opacity-45"
            />
          </div>
          <div className="resize-label whitespace-nowrap text-left text-sm  leading-4">
            {t("otherWithCount", { count: otherItemsCount })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastCardWrapper;
