import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { initiativesPageData } from "../data";

const ProgramCtaSection = () => {
  const t = useTranslations();
  const { programCta } = initiativesPageData;

  return (
    <section className="flex min-h-[517px] items-center justify-center bg-blue-900 px-5 py-16 text-center text-white md:px-12">
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-5">
        <p className="m-0 text-[11px] font-normal uppercase leading-[13.2px] tracking-[1.98px] text-gray-200/70">
          {t(programCta.eyebrowKey)}
        </p>
        <h2 className="m-0 max-w-[420px] text-balance text-[40px] font-medium leading-[110%] tracking-[-1.2px] text-white dark:text-white">
          {t(programCta.headingKey)}
        </h2>
        <p className="m-0 max-w-[480px] text-base font-normal leading-[24.768px] text-gray-200/80">
          {t(programCta.descriptionKey)}
        </p>
        {programCta.pitchHref && (
          <Link
            href={programCta.pitchHref}
            className="inline-flex h-[41.8px] items-center justify-center gap-2 rounded-md border border-white/40 bg-transparent px-[17.911px] text-[13.9px] font-semibold leading-[13.935px] text-gray-200 no-underline hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t(programCta.pitchLabelKey)}
            <FontAwesomeIcon
              icon={faArrowRight}
              aria-hidden="true"
              className="size-3"
            />
          </Link>
        )}
      </div>
    </section>
  );
};

export default ProgramCtaSection;
