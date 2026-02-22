import { useTranslations } from "next-intl";
import React from "react";

const PrivateBadge: React.FC = () => {
  const t = useTranslations();

  return (
    <div className="absolute bottom-1.5 right-1.5 w-fit rounded-sm bg-black/30 px-1 py-0.5 text-xs font-bold text-gray-0">
      {t("private")}
    </div>
  );
};

export default PrivateBadge;
