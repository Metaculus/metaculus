import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

const EmptyPlaceholder: FC = () => {
  const t = useTranslations();

  return (
    <div className="whitespace-pre-line">
      {t.rich("myBotsEmpty", {
        link: (chunks) => <Link href="/">{chunks}</Link>,
      })}
    </div>
  );
};

export default EmptyPlaceholder;
