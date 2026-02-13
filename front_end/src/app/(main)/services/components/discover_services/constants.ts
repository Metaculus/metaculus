import {
  faGraduationCap,
  faIndustry,
  faLandmark,
  faPeopleGroup,
} from "@fortawesome/free-solid-svg-icons";

export const DISCOVER_SERVICES_CARDS = [
  {
    type: "enterprise",
    titleKey: "discoverServicesEnterpriseTitle",
    descriptionKey: "discoverServicesEnterpriseDescription",
    icon: faIndustry,
  },
  {
    type: "government",
    titleKey: "discoverServicesGovernmentTitle",
    descriptionKey: "discoverServicesGovernmentDescription",
    icon: faLandmark,
  },
  {
    type: "non-profit",
    titleKey: "discoverServicesNonProfitTitle",
    descriptionKey: "discoverServicesNonProfitDescription",
    icon: faPeopleGroup,
  },
  {
    type: "academia",
    titleKey: "discoverServicesAcademiaTitle",
    descriptionKey: "discoverServicesAcademiaDescription",
    icon: faGraduationCap,
  },
] as const;
