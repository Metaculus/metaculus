import { FC } from "react";

import { TopChrome } from "@/app/(main)/components/top_chrome";

import { appendServicesQuizRow } from "../append_services_quiz_row";
import { ServicesQuizCategory } from "../constants";
import { ServicesQuizRootProvider } from "./quiz_state/services_quiz_root_provider";
import ServicesQuizExitModal from "./services_quiz_exit_modal";
import ServicesQuizFlowContent from "./services_quiz_flow_content";
import ServicesQuizHeader from "./services_quiz_header";

type Props = {
  initialCategory: ServicesQuizCategory | null;
};

const ServicesQuizScreen: FC<Props> = ({ initialCategory }) => {
  return (
    <ServicesQuizRootProvider
      initialCategory={initialCategory}
      exitTo="/services"
      onSubmit={appendServicesQuizRow}
    >
      <TopChrome defaultHeader={<ServicesQuizHeader />} />
      <ServicesQuizFlowContent />
      <ServicesQuizExitModal />
    </ServicesQuizRootProvider>
  );
};

export default ServicesQuizScreen;
