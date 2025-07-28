import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = {
  className?: string;
};

const ForecastMakerContainer: FC<PropsWithChildren<Props>> = ({
  className,
  children,
}) => {
  const t = useTranslations();
  return (
    <section
      id="prediction-section"
      className={cn("rounded bg-blue-200 p-3 dark:bg-blue-200-dark", className)}
    >
      <h3 className="m-0 text-base font-normal text-blue-900">
        {t("makePrediction")}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
};

export default ForecastMakerContainer;
