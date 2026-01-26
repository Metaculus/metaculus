import { TCaseStudyCard } from "./types";
import AEILogo from "../../assets/aei.svg?url";
import CoefficientGivingLogo from "../../assets/coefficient-giving.svg?url";
import ForbesLogo from "../../assets/forbes.svg?url";
import NihNsfPreview from "../../assets/nih-nsf-report-preview.png";

export const CASE_STUDIES: TCaseStudyCard[] = [
  {
    id: "nih-nsf-pro-forecasting",
    title: "Pro Forecasters Expect Steady NIH and NSF Funding",
    body: {
      intro: "Among the key findings:",
      bullets: [
        "Both NIH and NSF are expected to avoid deep cuts, with appropriations broadly stable.",
        "NSF faces greater near-term risk in FY2026 due to a $2B gap between House and Senate proposals, but outcomes are expected to align more closely with the Senate’s status quo position.",
      ],
    },
    partners: {
      label: "In partnership with",
      logos: [{ src: CoefficientGivingLogo, alt: "Coefficient Giving" }],
    },
    aboutInitiative:
      "A short paragraph about the initiative explaining what it was all about and why this report was created in the first place.",
    report: {
      previewImageSrc: NihNsfPreview,
      previewImageAlt: "NIH/NSF report preview",
      fileName: "research-agencies-report-2",
      pageCount: 8,
      publishedAtLabel: "Sep 16, 2025",
    },
    cta: {
      label: "Read full report",
      href: "/notebooks/39977/report-pro-forecasters-expect-steady-nih-and-nsf-funding/",
    },
  },
  {
    id: "nih-nsf-pro-forecasting-2",
    title: "Pro Forecasters Expect Steady NIH and NSF Funding",
    body: {
      intro: "Among the key findings:",
      bullets: [
        "Both NIH and NSF are expected to avoid deep cuts, with appropriations broadly stable.",
        "NSF faces greater near-term risk in FY2026 due to a $2B gap between House and Senate proposals, but outcomes are expected to align more closely with the Senate’s status quo position.",
      ],
    },
    partners: {
      label: "In partnership with",
      logos: [
        { src: AEILogo, alt: "AEI" },
        { src: CoefficientGivingLogo, alt: "Coefficient Giving" },
        { src: ForbesLogo, alt: "Forbes" },
      ],
    },
    aboutInitiative:
      "A short paragraph about the initiative explaining what it was all about and why this report was created in the first place.",
    report: {
      previewImageSrc: NihNsfPreview,
      previewImageAlt: "NIH/NSF report preview",
      fileName: "research-agencies-report-2",
      pageCount: 8,
      publishedAtLabel: "Sep 16, 2025",
    },
    cta: {
      label: "Read full report",
      href: "/notebooks/39977/report-pro-forecasters-expect-steady-nih-and-nsf-funding/",
    },
  },
];
