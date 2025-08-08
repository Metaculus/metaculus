import {
  metadata,
  heading,
  solutions,
  tournaments,
  privateInstances,
  proForecasters,
} from "./config";
import ServicesPageTemplate from "../../components/services_page_template";

export { metadata };

export default function TechnologyServicesPage() {
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
