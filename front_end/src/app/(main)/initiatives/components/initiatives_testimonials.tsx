import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import InitiativeQuoteFigure from "./initiative_quote";
import { InitiativesTestimonial } from "../types";

type Props = {
  testimonials: InitiativesTestimonial[];
};

const InitiativesTestimonials: FC<Props> = ({ testimonials }) => {
  const t = useTranslations();

  if (testimonials.length === 0) return null;

  const shouldScroll = testimonials.length > 3;

  return (
    <section
      id="initiatives-testimonials"
      aria-labelledby="initiatives-testimonials-title"
      className="flex flex-col items-center gap-8 xl:gap-12"
    >
      <h3
        id="initiatives-testimonials-title"
        className="m-0 text-balance text-center text-[32px] font-medium leading-[110%] tracking-[-0.025em] text-blue-900 dark:text-blue-900-dark"
      >
        {t("initiativesTestimonialsTitle")}
      </h3>

      <ul
        tabIndex={0}
        className={cn(
          "-mx-5 my-0 flex w-[calc(100%+2.5rem)] snap-x snap-mandatory scroll-px-5 list-none gap-12 overflow-x-auto px-5 py-0 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 dark:focus-visible:ring-blue-800-dark md:-mx-12 md:w-[calc(100%+6rem)] md:scroll-px-12 md:px-12",
          shouldScroll
            ? "xl:mx-0 xl:w-full xl:scroll-px-0 xl:px-0"
            : "xl:mx-0 xl:grid xl:w-full xl:snap-none xl:grid-cols-3 xl:overflow-visible xl:px-0"
        )}
      >
        {testimonials.map((testimonial) => (
          <li
            key={testimonial.id}
            className={cn(
              "flex w-[min(367px,85vw)] shrink-0 snap-start",
              shouldScroll ? "xl:w-[calc((100%-6rem)/3)]" : "xl:w-auto"
            )}
          >
            <InitiativeQuoteFigure quote={testimonial} size="lg" />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default InitiativesTestimonials;
