import { useTranslations } from "next-intl";

import FeaturedInitiativeRow from "../components/featured_initiative_row";
import { getFeaturedInitiatives } from "../data";

const FeaturedSection = () => {
  const t = useTranslations();
  const featured = getFeaturedInitiatives();

  if (featured.length === 0) return null;

  return (
    <section
      id="initiatives-featured"
      aria-labelledby="initiatives-featured-title"
      className="scroll-mt-nav bg-gray-0"
    >
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-12 lg:pt-20">
        <h2 id="initiatives-featured-title" className="sr-only">
          {t("initiativesFeaturedTitle")}
        </h2>

        <div className="divide-y divide-blue-400 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:py-10">
          {featured.map((initiative, index) => (
            <FeaturedInitiativeRow
              key={initiative.id}
              initiative={initiative}
              artworkSide={index < 2 ? "start" : "end"}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
