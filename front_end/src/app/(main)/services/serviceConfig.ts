import IsabelJuniewiczImage from "@/app/(main)/pro-forecasters/assets/Isabel Juniewicz.png";
import PeterWildefordImage from "@/app/(main)/pro-forecasters/assets/Peter Wildeford.png";
import ScottEastmanImageImage from "@/app/(main)/pro-forecasters/assets/Scott Eastman.jpeg";

const ServiceConfig = {
  spotlightTournamentId: "bridgewater",
  proForecastersImages: [
    PeterWildefordImage,
    IsabelJuniewiczImage,
    ScottEastmanImageImage,
    PeterWildefordImage,
    IsabelJuniewiczImage,
    "placeholder-for-last-circle",
  ],
  // Use order to sort tournaments in the carousel
  tournamentsOrder: [
    { id: "bridgewater" },
    { id: "keep-virginia-safe-ii" },
    { id: "fiscal" },
    { id: "climate", order: 4 },
  ],
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
    {
      light: "/partners/bw-light-alt.svg?url",
      dark: "/partners/bw-dark-alt.svg?url",
      alt: "Bridgewater logo",
      height: "27",
    },
    {
      light: "/partners/LSE-light.svg?url",
      dark: "/partners/LSE-dark.svg?url",
      alt: "LSE logo",
      height: "50",
      href: "https://www.lse.ac.uk/",
    },
  ],
};

export default ServiceConfig;
