import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

const EmptyPlaceholder: FC = () => {
  const t = useTranslations();

  return (
    <div className="whitespace-pre-line">
      {t.rich("myBotsEmpty", {
        link: (chunks) => (
          <Link
            href="https://www.metaculus.com/notebooks/38928/ai-benchmark-resources/#want-to-join-the-ai-forecasting-benchmark"
            target="_blank"
            rel="noopener noreferrer"
          >
            {chunks}
          </Link>
        ),
      })}
    </div>
  );
};

export default EmptyPlaceholder;
