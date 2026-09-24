import { useTranslations } from "next-intl";

import FeaturedInitiativeRow from "../components/featured_initiative_row";
import InitiativesTestimonials from "../components/initiatives_testimonials";
import { getFeaturedInitiatives, initiativesPageData } from "../data";

const FeaturedSection = () => {
  const t = useTranslations();
  const featured = getFeaturedInitiatives();

  if (featured.length === 0) return null;

  const leading = featured.slice(0, 2);
  const trailing = featured.slice(2);

  return (
    <section aria-labelledby="initiatives-featured-title">
      <div className="mx-auto w-full max-w-[1404px] px-5 pt-12 md:px-12 xl:pt-[120px]">
        <h2 id="initiatives-featured-title" className="sr-only">
          {t("initiativesFeaturedTitle")}
        </h2>

        <div
          id="initiatives-featured"
          className="scroll-mt-[calc(var(--top-chrome-height,3rem)+2rem)] divide-y divide-[#C8D3D7] dark:divide-blue-400-dark [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:pb-16 [&>*]:pt-8 [&>section]:pt-16 xl:[&>section]:py-[110px]"
        >
          {leading.map((initiative) => (
            <FeaturedInitiativeRow
              key={initiative.id}
              initiative={initiative}
              artworkSide="start"
            />
          ))}

          <InitiativesTestimonials
            testimonials={initiativesPageData.testimonials ?? []}
          />

          {trailing.map((initiative) => (
            <FeaturedInitiativeRow
              key={initiative.id}
              initiative={initiative}
              artworkSide="end"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
