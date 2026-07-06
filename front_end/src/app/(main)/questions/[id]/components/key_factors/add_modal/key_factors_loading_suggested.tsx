import { useTranslations } from "next-intl";

import LoadingSpinner from "@/components/ui/loading_spiner";

const KeyFactorsLoadingSuggested: React.FC = () => {
  const t = useTranslations();
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-2 md:w-[576px]">
      <p className="text-base leading-tight">
        {t("loadingSuggestedKeyFactors")}
      </p>
      <LoadingSpinner />
    </div>
  );
};

export default KeyFactorsLoadingSuggested;
