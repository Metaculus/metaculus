import {
  heading,
  solutions,
  tournaments,
  privateInstances,
  proForecasters,
  metadata,
} from "./config";
import ServicesPageTemplate from "../../components/services_page_template";

export { metadata };

export default function ClimateServicesPage() {
  return (
    <ServicesPageTemplate
      heading={heading}
      solutions={solutions}
      tournaments={tournaments}
      privateInstances={privateInstances}
      proForecasters={proForecasters}
    />
  );
}
