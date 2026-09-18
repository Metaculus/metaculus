import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import { resolveAssetSource } from "../helpers/assets";
import { InitiativesTestimonial, TestimonialAccent } from "../types";

const ACCENT_BORDER: Record<TestimonialAccent, string> = {
  blue: "border-[#2C77B4]",
  purple: "border-purple-700 dark:border-purple-700-dark",
};

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
      className="flex flex-col items-center gap-10 xl:gap-20"
    >
      <h3
        id="initiatives-testimonials-title"
        className="m-0 flex items-center gap-2.5 text-center text-base font-medium leading-[14px] text-blue-900 dark:text-blue-900-dark"
      >
        <span aria-hidden="true" className="size-2 shrink-0 bg-[#2C77B4]" />
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
        {testimonials.map(
          ({ id, quoteKey, authorKey, roleKey, avatar, accent }) => {
            const avatarSource = avatar ? resolveAssetSource(avatar) : null;

            return (
              <li
                key={id}
                className={cn(
                  "flex w-[min(367px,85vw)] shrink-0 snap-start",
                  shouldScroll ? "xl:w-[calc((100%-6rem)/3)]" : "xl:w-auto"
                )}
              >
                <figure className="m-0 flex w-full flex-col justify-between gap-10 xl:gap-12">
                  <blockquote
                    className={cn(
                      "m-0 max-w-[367px] border-l-2 pl-5 text-left text-[20px] font-normal leading-[140%] tracking-[-0.4px] text-blue-900 dark:text-blue-900-dark",
                      ACCENT_BORDER[accent ?? "blue"]
                    )}
                  >
                    {t(quoteKey)}
                  </blockquote>

                  <figcaption className="flex min-h-11 items-center gap-3 text-left">
                    {avatarSource ? (
                      <Image
                        src={avatarSource.src}
                        unoptimized={avatarSource.unoptimized}
                        alt=""
                        width={44}
                        height={44}
                        className="size-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="size-11 shrink-0 rounded-full bg-blue-300 dark:bg-blue-300-dark"
                      />
                    )}
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold leading-[16.8px] text-blue-900 dark:text-blue-900-dark">
                        {t(authorKey)}
                      </span>
                      <span className="text-[12.5px] font-normal leading-[16.25px] text-blue-700 dark:text-blue-700-dark">
                        {t(roleKey)}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            );
          }
        )}
      </ul>
    </section>
  );
};

export default InitiativesTestimonials;
