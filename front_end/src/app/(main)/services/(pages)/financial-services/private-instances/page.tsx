import {
  metadata,
  title,
  sinceDebut,
  deployedDescription,
  platformBlock,
  stepsDescription,
  steps,
} from "./config";
import PrivateInstancesPageTemplate from "../../../components/templates/private_instances_page_template";

export { metadata };

export default function FinancialPrivateInstancePage() {
  return (
    <PrivateInstancesPageTemplate
      title={title}
      sinceDebut={sinceDebut}
      deployedDescription={deployedDescription}
      platformBlock={platformBlock}
      stepsDescription={stepsDescription}
      steps={steps}
    />
  );
}
