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
    // bridgewater
    { id: 32567 },
    // keep-virginia-safe-ii
    { id: 2100 },
    // fiscal
    { id: 32725 },
    // climate
    { id: 1756 },
  ],
  // Use order to sort tournaments in the carousel/list
  tournamentsOrder: [
    // bridgewater
    { id: 32567, order: 1 },
    // keep-virginia-safe-ii
    { id: 2100, order: 2 },
    // respiratory-outlook-24-25
    { id: 3411, order: 3 },
    // fiscal
    { id: 32725, order: 4 },
    // climate
    { id: 1756, order: 5 },
    // biosecurity-tournament
    { id: 1703, order: 6 },
    // market-pulse
    { id: 32917, order: 7 },
    // flusight-challenge23-24
    { id: 2569, order: 8 },
    // global-pulse
    { id: 2722, order: 9 },
    // aibq2
    { id: 32721, order: 10 },
    // metaculus-cup
    { id: 32828, order: 11 },
    // ukraine-conflict
    { id: 1426, order: 12 },
  ],
  spotlightTournamentId: "bridgewater-2025",
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
