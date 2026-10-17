export const DISEASE_IDS = [
  "respiratory",
  "measles",
  "ebola",
  "screwworm",
  "chikungunya",
  "h5",
  "mpox",
  "hantavirus",
] as const;

export type DiseaseId = (typeof DISEASE_IDS)[number];

export const DISEASE_NAME_KEYS = {
  respiratory: "globalHealthMonitorDiseaseRespiratory",
  measles: "globalHealthMonitorDiseaseMeasles",
  ebola: "globalHealthMonitorDiseaseEbola",
  screwworm: "globalHealthMonitorDiseaseScrewworm",
  chikungunya: "globalHealthMonitorDiseaseChikungunya",
  h5: "globalHealthMonitorDiseaseH5",
  mpox: "globalHealthMonitorDiseaseMpox",
  hantavirus: "globalHealthMonitorDiseaseHantavirus",
} as const satisfies Record<DiseaseId, string>;
