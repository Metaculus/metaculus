"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

import {
  NasdaqLogo,
  ForbesLogo,
  TheAtlanticLogo,
  AeiLogo,
  TheEconomistLogo,
  BloombergLogo,
} from "./featured-in-logos";

type FeaturedItem = {
  href: string;
  label: string;
  articleTitle: string;
  component: ReactNode;
};

const FEATURED_IN: FeaturedItem[] = [
  {
    href: "https://www.nasdaq.com/articles/how-crypto-can-help-secure-ai",
    label: "Nasdaq",
    articleTitle: "How Crypto Can Help Secure AI",
    component: <NasdaqLogo className="h-4 w-auto text-gray-800 md:h-8" />,
  },
  {
    href: "https://www.forbes.com/sites/stevenwolfepereira/2025/12/08/building-a-one-person-unicorn-this-startup-just-raised-87m-to-help/",
    label: "Forbes",
    articleTitle:
      "Building A One-Person Unicorn: This Startup Just Raised $87M To Help",
    component: <ForbesLogo className="h-3.5 w-auto text-gray-800 md:h-7" />,
  },
  {
    href: "https://archive.is/0O588",
    label: "The Atlantic",
    articleTitle: "The Atlantic Feature",
    component: <TheAtlanticLogo className="h-8 w-auto text-gray-800 md:h-16" />,
  },
  {
    href: "https://www.aei.org/articles/the-great-ai-forecasting-divide/1",
    label: "AEI",
    articleTitle: "The Great AI Forecasting Divide",
    component: <AeiLogo className="h-4 w-auto text-[#008CCC] md:h-8" />,
  },
  {
    href: "https://www.economist.com/finance-and-economics/2023/05/23/what-would-humans-do-in-a-world-of-super-ai",
    label: "The Economist",
    articleTitle: "What Would Humans Do in a World of Super AI?",
    component: <TheEconomistLogo className="h-5 w-auto md:h-10" />,
  },
  {
    href: "https://www.bloomberg.com/opinion/articles/2024-03-24/can-sam-altman-make-ai-smart-enough-to-answer-these-6-questions",
    label: "Bloomberg",
    articleTitle:
      "Can Sam Altman Make AI Smart Enough to Answer These 6 Questions?",
    component: <BloombergLogo className="h-3.5 w-auto text-gray-800 md:h-7" />,
  },
];

const FeaturedInMarquee: FC<{ className?: string }> = ({ className }) => {
  const t = useTranslations();

  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      containScroll: "trimSnaps",
      watchDrag: false,
    },
    [
      AutoScroll({
        speed: 0.3,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );

  // Duplicate for seamless infinite scrolling
  const logos = [...FEATURED_IN, ...FEATURED_IN, ...FEATURED_IN];

  return (
    <section
      className={cn("flex flex-col items-center gap-6 pb-8 pt-4", className)}
    >
      <span className="text-sm font-medium uppercase tracking-wider text-gray-500">
        {t("featuredIn")}
      </span>

      <div className="relative mx-auto w-full max-w-[1140px] px-0">
        <div className="h-[40px] overflow-hidden md:h-[70px]" ref={emblaRef}>
          <div className="flex h-full w-full">
            {logos.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex h-full flex-none items-center"
              >
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={`${item.label}: ${item.articleTitle}`}
                  className="flex items-center px-4 opacity-35 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:px-8"
                >
                  {item.component}
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute left-0 top-0 h-full w-[100px] bg-gradient-to-r from-blue-200 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[100px] bg-gradient-to-l from-blue-200 to-transparent" />
      </div>
    </section>
  );
};

export default FeaturedInMarquee;
