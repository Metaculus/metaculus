"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";

import InitiativeInventoryCard from "./initiative_inventory_card";
import { Initiative, InitiativeCategory } from "../types";

type Props = {
  category: InitiativeCategory;
  initiatives: Initiative[];
  color: string;
};

const InventoryCategoryCarousel: FC<Props> = ({
  category,
  initiatives,
  color,
}) => {
  const t = useTranslations();
  const titleId = `initiatives-category-${category.id}`;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4 md:gap-6">
      <h3
        id={titleId}
        className="m-0 flex min-h-[34px] items-center text-2xl font-medium leading-[110%] tracking-[-1.44px] text-blue-900 dark:text-blue-900-dark sm:min-h-[38px] md:text-[32px] md:tracking-[-1.92px]"
      >
        {t(category.labelKey)}
      </h3>

      {/* The row bleeds into the page gutter so hover rings and the last
          card's trailing space aren't clipped by the scroll container. */}
      <ReusableGradientCarousel
        items={initiatives}
        renderItem={(initiative) => (
          <InitiativeInventoryCard
            initiative={initiative}
            color={color}
            view="grid"
            titleAs="h4"
          />
        )}
        className="-mx-5 md:-mx-12"
        viewportClassName="scroll-pl-5 md:scroll-pl-12"
        listClassName="px-5 py-2.5 md:px-12"
        itemClassName="@container w-[85%] last:box-content last:pr-5 md:w-[calc((100%-24px)/2)] md:last:pr-12 xl:w-[calc((100%-48px)/3)]"
        gapClassName="gap-6"
        slideBy={{ mode: "page" }}
        gradientFromClass="from-gray-0 dark:from-gray-0-dark"
        gradientWidthClass="w-8 md:w-16"
        arrowClassName="hidden size-10 items-center justify-center rounded-full bg-blue-900 text-gray-0 shadow-sm dark:bg-blue-900-dark dark:text-gray-0-dark md:inline-flex"
        arrowLeftPosition="left-1"
        arrowRightPosition="right-1"
        prevLabel={t("scrollLeft")}
        nextLabel={t("scrollRight")}
        wheelToHorizontal={false}
      />
    </section>
  );
};

export default InventoryCategoryCarousel;
