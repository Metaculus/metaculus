import type { StaticImageData } from "next/image";

import { IconLike } from "@/app/(main)/aib/components/aib/light-dark-icon";

export type CaseStudyPartnerLogo = {
  alt: string;
  href?: string;
  lightSrc?: IconLike;
  darkSrc?: IconLike;
  src?: string | StaticImageData;
};

export type CaseStudyReportCard = {
  previewImageSrc: string | StaticImageData;
  previewImageAlt?: string;
  fileName: string;
  pageCount: number;
  publishedAtLabel?: string;
};

export type TCaseStudyCard = {
  id: string;
  title: React.ReactNode;
  body: {
    intro?: React.ReactNode;
    bullets: React.ReactNode[];
  };
  aboutInitiative?: React.ReactNode;
  partners?: {
    label?: React.ReactNode;
    logos: CaseStudyPartnerLogo[];
  };
  report?: CaseStudyReportCard;
  cta: {
    label?: string;
    href: string;
    analyticsId?: string;
  };
};
