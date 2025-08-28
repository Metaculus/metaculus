import {
  metadata,
  title,
  description,
  howItWorksDescription,
  steps,
  caseStudy,
  serviceOptions,
} from "./config";
import ProForecastersPageTemplate from "../../../components/templates/pro_forecasters_page_template";

export { metadata };

export default function FinancialServicesProForecastersPage() {
  return (
    <ProForecastersPageTemplate
      title={title}
      description={description}
      howItWorksDescription={howItWorksDescription}
      steps={steps}
      caseStudy={caseStudy}
      serviceOptions={serviceOptions}
    />
  );
}
