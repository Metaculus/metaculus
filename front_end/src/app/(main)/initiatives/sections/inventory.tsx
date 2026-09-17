import { useTranslations } from "next-intl";

import InitiativesInventory from "../components/initiatives_inventory";
import {
  ALL_INITIATIVES_FILTER_ID,
  getInitiativesByPlacement,
  getInventoryFilters,
} from "../data";

const InventorySection = () => {
  const t = useTranslations();

  return (
    <section
      id="initiatives-inventory"
      aria-labelledby="initiatives-inventory-title"
      className="scroll-mt-nav bg-gray-0 dark:bg-gray-0-dark"
    >
      <div className="mx-auto w-full max-w-[1404px] px-5 pb-20 md:px-12">
        <h2 id="initiatives-inventory-title" className="sr-only">
          {t("initiativesInventoryTitle")}
        </h2>

        <InitiativesInventory
          initiatives={getInitiativesByPlacement("inventory")}
          filters={getInventoryFilters()}
          initialFilterId={ALL_INITIATIVES_FILTER_ID}
        />
      </div>
    </section>
  );
};

export default InventorySection;
