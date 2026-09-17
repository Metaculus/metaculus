import { useTranslations } from "next-intl";

import FeaturedInitiativeRow from "../components/featured_initiative_row";
import InitiativesTestimonials from "../components/initiatives_testimonials";
import { getFeaturedInitiatives, initiativesPageData } from "../data";
import { resolveTestimonials } from "../helpers/testimonials";

const FeaturedSection = () => {
  const t = useTranslations();
  const featured = getFeaturedInitiatives();

  if (featured.length === 0) return null;

  const testimonials = resolveTestimonials(
    initiativesPageData.testimonials,
    (key) => t(key)
  );
  const leading = featured.slice(0, 2);
  const trailing = featured.slice(2);

  return (
    <section
      id="initiatives-featured"
      aria-labelledby="initiatives-featured-title"
      className="scroll-mt-nav bg-gray-0 dark:bg-gray-0-dark"
    >
      <div className="mx-auto w-full max-w-5xl px-5 pt-12 md:px-12 xl:pt-[120px]">
        <h2 id="initiatives-featured-title" className="sr-only">
          {t("initiativesFeaturedTitle")}
        </h2>

        <div className="divide-y divide-blue-400 dark:divide-blue-400-dark [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:pb-16 [&>*]:pt-8">
          {leading.map((initiative) => (
            <FeaturedInitiativeRow
              key={initiative.id}
              initiative={initiative}
              artworkSide="start"
            />
          ))}

          <InitiativesTestimonials testimonials={testimonials} />

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
