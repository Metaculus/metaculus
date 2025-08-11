import {
  heading,
  metadata,
  privateInstances,
  proForecasters,
  solutions,
  tournaments,
} from "./config";
import ServicesPageTemplate from "../../components/templates/services_page_template";

export { metadata };

export default function PharmaceuticalServicesPage() {
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
