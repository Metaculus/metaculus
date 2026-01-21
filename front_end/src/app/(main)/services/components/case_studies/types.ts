import { StaticImageData } from "next/image";

export type CaseStudyPartnerLogo = {
  src: string;
  alt: string;
  href?: string;
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
