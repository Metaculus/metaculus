import { TCaseStudyCard } from "./types";
import CoefficientGivingLogoDark from "../../assets/coefficient-giving-light.svg?url";
import CoefficientGivingLogoLight from "../../assets/coefficient-giving.svg?url";
import NihNsfPreview from "../../assets/nih-nsf-report-preview.png";
import OwidLogoDark from "../../assets/owid-light.svg?url";
import OwidPreview from "../../assets/owid-report-preview.png";
import OwidLogoLight from "../../assets/owid.svg?url";

export const CASE_STUDIES: TCaseStudyCard[] = [
  {
    id: "research-agencies-outlook",
    title: "Research Agencies Outlook",
    body: {
      intro: "Among the key findings:",
      bullets: [
        "Both NIH and NSF were expected to avoid deep cuts, with appropriations broadly stable.",
        "NSF faces greater near-term risk in FY2026 due to a $2B gap between House and Senate proposals, but outcomes were expected to align more closely with the Senate's status quo position.",
      ],
    },
    partners: {
      logos: [
        {
          alt: "Coefficient Giving",
          lightSrc: CoefficientGivingLogoLight,
          darkSrc: CoefficientGivingLogoDark,
        },
      ],
    },
    aboutInitiative: (
      <>
        Commissioned by Coefficient Giving&apos;s{" "}
        <a
          href="https://www.openphilanthropy.org/focus/abundance-and-growth/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Abundance & Growth Fund
        </a>
        , the <em>Research Agencies Outlook</em> presents predictions and
        reasoning from{" "}
        <a href="/services/pro-forecasters/" className="underline">
          Metaculus Pro Forecasters
        </a>{" "}
        about the budget and obligations of the National Institutes of Health
        (NIH) and National Science Foundation (NSF) for fiscal years 2026
        through 2028. These forecasts matter because NIH and NSF are not just
        agencies, but are{" "}
        <em>
          two of the largest sources of public funding for basic research{" "}
          <a
            href="https://www.nature.com/articles/d41586-025-02811-4"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            in the world
          </a>
        </em>
        . Anticipating their budget trajectories is critical for scientists,
        institutions, and policymakers alike.
      </>
    ),
    report: {
      previewImageSrc: NihNsfPreview,
      previewImageAlt: "NIH/NSF report preview",
      fileName: "research-agencies-outlook",
      pageCount: 8,
      publishedAtLabel: "Sep 16, 2025",
    },
    cta: {
      labelKey: "readFullReport",
      href: "/notebooks/39977/report-pro-forecasters-expect-steady-nih-and-nsf-funding/",
    },
  },
  {
    id: "owid-next-100-years",
    title: "Forecasting Our World in Data: The Next 100 Years",
    body: {
      intro: "Among the key findings:",
      bullets: [
        "The next 100 years were expected to see high-growth, longer lifespans, and radically higher productivity, largely driven by AI and associated technological developments.",
        "Energy was predicted to become cleaner and more abundant overall in the long run.",
        "Long-run demographics and political shifts were a key uncertainty, with declining fertility, stabilizing population with AI-disaster tail risks, flat trust in government, and a slowly climbing number of people living in liberal democracies.",
      ],
    },
    partners: {
      logos: [
        {
          alt: "Our World in Data",
          lightSrc: OwidLogoLight,
          darkSrc: OwidLogoDark,
          sizePx: 28,
        },
      ],
    },
    aboutInitiative:
      "Developed in collaboration with Our World in Data (OWID), this project deployed Metaculus Pro Forecasters to predict key measures of human progress over various time horizons. Thirty OWID-tracked time-series metrics were selected to collectively illuminate what the future might hold according to Metaculus\u2019s most accurate forecasters.",
    report: {
      previewImageSrc: OwidPreview,
      previewImageAlt: "OWID report preview",
      fileName: "owid-report",
      pageCount: 65,
      publishedAtLabel: "Feb 20, 2025",
    },
    cta: {
      labelKey: "readFullReport",
      href: "/files/forecasting-owid-report.pdf",
    },
  },
];
