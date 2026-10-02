export type GhmSource = { name: string; url: string };

export const GHM_SOURCES = {
  cdcMeasles: {
    name: "CDC",
    url: "https://www.cdc.gov/measles/data-research/index.html",
  },
  ecdcMeasles: {
    name: "ECDC",
    url: "https://measles-rubella-monthly.ecdc.europa.eu/",
  },
  cdcEbola: {
    name: "CDC",
    url: "https://www.cdc.gov/ebola/situation-summary/index.html",
  },
  whoOutbreakNews: {
    name: "WHO",
    url: "https://www.who.int/emergencies/disease-outbreak-news",
  },
  usdaScrewworm: {
    name: "USDA APHIS",
    url: "https://www.aphis.usda.gov/animals/animal-health/livestock-and-poultry-disease/stop-screwworm/current-status/confirmed",
  },
  ecdcChikungunya: {
    name: "ECDC",
    url: "https://www.ecdc.europa.eu/en/chikungunya-virus-disease/surveillance-and-updates/seasonal-surveillance",
  },
  spfChikungunya: {
    name: "Santé publique France",
    url: "https://www.santepubliquefrance.fr/en/vector-borne-diseases/chikungunya/national-bulletin/chikungunya-dengue-zika-and-west-nile-virus-mainland-france-enhanced-surveillance-bulletin-august-12",
  },
  cdcRespNet: {
    name: "CDC RESP-NET",
    url: "https://www.cdc.gov/resp-net/dashboard/index.html",
  },
  cdcFluView: {
    name: "CDC FluView",
    url: "https://www.cdc.gov/fluview/index.html",
  },
  cdcFluSeverity: {
    name: "CDC",
    url: "https://www.cdc.gov/flu/php/surveillance/in-season-severity.html",
  },
} as const satisfies Record<string, GhmSource>;

export type GhmSourceId = keyof typeof GHM_SOURCES;
