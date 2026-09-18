import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import { resolveAssetSource } from "../helpers/assets";
import { TestimonialAccent, TestimonialContent } from "../types";

const ACCENT_BORDER: Record<TestimonialAccent, string> = {
  blue: "border-[#2C77B4]",
  purple: "border-purple-700 dark:border-purple-700-dark",
};

type Props = {
  testimonials: TestimonialContent[];
  id?: string;
  className?: string;
};

const InitiativesTestimonials: FC<Props> = ({
  testimonials,
  id = "initiatives-testimonials",
  className,
}) => {
  const t = useTranslations();

  if (testimonials.length === 0) return null;

  const headingId = `${id}-title`;
  const shouldScroll = testimonials.length > 3;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("flex flex-col items-center gap-10 lg:gap-14", className)}
    >
      <h3
        id={headingId}
        className="m-0 flex items-center gap-2 text-[13px] font-medium leading-4 text-blue-900 dark:text-blue-900-dark"
      >
        <span aria-hidden="true" className="size-1.5 shrink-0 bg-[#2C77B4]" />
        {t("initiativesTestimonialsTitle")}
      </h3>

      <ul
        tabIndex={0}
        className={cn(
          "-mx-5 my-0 flex w-[calc(100%+2.5rem)] snap-x snap-mandatory scroll-px-5 list-none gap-12 overflow-x-auto px-5 py-0 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 dark:focus-visible:ring-blue-800-dark md:-mx-12 md:w-[calc(100%+6rem)] md:scroll-px-12 md:px-12",
          shouldScroll
            ? "lg:mx-0 lg:w-full lg:scroll-px-0 lg:px-0"
            : "lg:mx-0 lg:grid lg:w-full lg:snap-none lg:grid-cols-3 lg:overflow-visible lg:px-0"
        )}
      >
        {testimonials.map(
          ({ id: testimonialId, quote, author, role, avatar, accent }) => {
            const avatarSource = avatar ? resolveAssetSource(avatar) : null;

            return (
              <li
                key={testimonialId}
                className={cn(
                  "flex w-[min(367px,85vw)] shrink-0 snap-start",
                  shouldScroll ? "lg:w-[calc((100%-6rem)/3)]" : "lg:w-auto"
                )}
              >
                <figure className="m-0 flex w-full flex-col justify-between gap-10">
                  <blockquote
                    className={cn(
                      "m-0 max-w-[367px] border-l-2 pl-5 text-left text-[20px] font-normal leading-[140%] tracking-[-0.4px] text-blue-900 dark:text-blue-900-dark",
                      ACCENT_BORDER[accent ?? "blue"]
                    )}
                  >
                    {quote}
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
                        {author}
                      </span>
                      <span className="text-[12.5px] font-normal leading-[16.25px] text-blue-700 dark:text-blue-700-dark">
                        {role}
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
