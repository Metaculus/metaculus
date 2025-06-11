import IsabelJuniewiczImage from "@/app/(main)/pro-forecasters/assets/Isabel Juniewicz.png";
import JaredImage from "@/app/(main)/pro-forecasters/assets/Jared.png";
import MarkusImage from "@/app/(main)/pro-forecasters/assets/Max.png";
import PeterWildefordImage from "@/app/(main)/pro-forecasters/assets/Peter Wildeford.png";
import ScottEastmanImage from "@/app/(main)/pro-forecasters/assets/Scott Eastman.jpeg";

const ServiceConfig = {
  proForecastersImages: [
    PeterWildefordImage,
    IsabelJuniewiczImage,
    ScottEastmanImage,
    MarkusImage,
    JaredImage,
    "placeholder-for-last-circle",
  ],
  mainPageTournamentsList: [
    { id: "bridgewater" },
    { id: "keep-virginia-safe-ii" },
    { id: "fiscal" },
    { id: "climate" },
  ],
  // Use order to sort tournaments in the carousel/list
  tournamentsOrder: [
    { id: "bridgewater", order: 1 },
    { id: "keep-virginia-safe-ii", order: 2 },
    { id: "respiratory-outlook-24-25", order: 3 },
    { id: "fiscal", order: 4 },
    { id: "climate", order: 5 },
    { id: "biosecurity-tournament", order: 6 },
    { id: "market-pulse", order: 7 },
    { id: "flusight-challenge23-24", order: 8 },
    { id: "global-pulse", order: 9 },
    { id: "aibq2", order: 10 },
    { id: "metaculus-cup", order: 11 },
    { id: "ukraine-conflict", order: 12 },
  ],
  spotlightTournamentId: "bridgewater",
  partnersLogos: [
    {
      light: "/partners/astera-logo.svg?url",
      dark: "/partners/astera-logo-dark.svg?url",
      alt: "Asteria logo",
      height: "50",
      href: "https://astera.org/",
    },
    {
      light: "/partners/clearer-thinking-logo.svg?url",
      dark: "/partners/clearer-thinking-logo-dark.svg?url",
      alt: "Clearer thinking logo",
      height: "50",
      href: "https://www.clearerthinking.org/",
    },
    {
      light: "/partners/convergence-logo.svg?url",
      dark: "/partners/convergence-logo-dark.svg?url",
      alt: "Convergence logo",
      height: "50",
      href: "https://www.convergenceanalysis.org/",
    },
    {
      light: "/partners/fas-logo.svg?url",
      dark: "/partners/fas-logo-dark.svg?url",
      alt: "FAS logo",
      height: "30",
      href: "https://fas.org/",
    },
    {
      light: "/partners/givewell-logo.svg?url",
      dark: "/partners/givewell-logo-dark.svg?url",
      alt: "Givewell logo",
      height: "27",
      href: "https://www.givewell.org/",
    },
    {
      light: "/partners/lehigh-light.svg?url",
      dark: "/partners/lehigh-dark.svg?url",
      alt: "Lehigh logo",
      height: "35",
      href: "https://health.lehigh.edu/",
    },
    // TODO: add BW logo after approval
    // {
    //   light: "/partners/bw-light-alt.svg?url",
    //   dark: "/partners/bw-dark-alt.svg?url",
    //   alt: "Bridgewater logo",
    //   height: "27",
    //   href: "https://bridgewater.com/",
    // },
    {
      light: "/partners/LSE-light.svg?url",
      dark: "/partners/LSE-dark.svg?url",
      alt: "LSE logo",
      height: "50",
      href: "https://www.lse.ac.uk/",
    },
    {
      light: "/partners/vox-fp-light.svg?url",
      dark: "/partners/vox-fp-dark.svg?url",
      alt: "Vox Future Perfect logo",
      height: "50",
      href: "https://www.vox.com/future-perfect",
    },
  ],
  caseStudyPDFLink:
    "https://metaculus-web-media.s3.us-west-2.amazonaws.com/static/metaculus_monthly_update_for_cdc_february_11_2025.pdf",
};

export default ServiceConfig;
