import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import InitiativeCarousel from "../components/initiative_carousel";
import { getInitiativesByPlacement, initiativesPageData } from "../data";

const HeroSection = async () => {
  const t = await getTranslations();
  const { hero } = initiativesPageData;
  const heroInitiatives = getInitiativesByPlacement("hero");

  return (
    <section className="flex flex-col items-center gap-8 px-4 pb-16 pt-10 text-center sm:pb-24 sm:pt-16">
      <p className="m-0 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-blue-700 dark:text-blue-700-dark">
        <span
          aria-hidden="true"
          className="size-1.5 bg-blue-700 dark:bg-blue-700-dark"
        />
        {t(hero.eyebrowKey)}
      </p>

      <h1 className="m-0 max-w-[764px] text-balance text-[36px] font-medium leading-[100%] tracking-[-1.7px] text-blue-900 dark:text-blue-900-dark md:text-[44px] md:tracking-[-2.8px] xl:text-[60px]">
        {t(hero.headingKey)}
      </h1>

      <p className="m-0 max-w-[676px] text-balance text-base font-normal leading-[160%] text-blue-900 dark:text-blue-900-dark md:text-[18px]">
        {t(hero.descriptionKey)}
      </p>

      {hero.actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {hero.actions.map((action) => (
            <Button
              key={action.id}
              href={action.href}
              variant={action.variant}
              size="md"
              className={cn(
                "h-[42px] rounded-md px-[18px] py-0 text-sm leading-[14px]",
                action.variant === "primary" && "text-white",
                action.variant === "secondary" &&
                  "border-[rgba(33,48,67,0.40)] bg-transparent font-semibold text-blue-900 dark:border-blue-500-dark dark:text-blue-900-dark"
              )}
            >
              {t(action.labelKey)}
            </Button>
          ))}
        </div>
      )}

      {heroInitiatives.length > 0 && (
        <div className="-mx-4 mt-4 w-[calc(100%+2rem)] md:mt-12">
          <InitiativeCarousel
            initiatives={heroInitiatives}
            initialInitiativeId={hero.initialInitiativeId}
          />
        </div>
      )}
    </section>
  );
};

export default HeroSection;
