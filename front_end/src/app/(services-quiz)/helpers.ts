import { ServicesQuizAnswersState } from "./components/quiz_state/services_quiz_answers_provider";

export type ServicesQuizSubmitPayload = ReturnType<
  typeof aggregateServicesQuizAnswers
>;

export function aggregateServicesQuizAnswers(state: ServicesQuizAnswersState) {
  const name = state.contactName.trim();
  const email = state.contactEmail.trim();

  if (!name || !email) {
    throw new Error("Contact name and email are required");
  }

  return {
    category: state.category,
    challenges: state.selectedChallenges,
    notes: state.notes.trim() || null,
    timing: state.timing,
    whoForecasts: state.whoForecasts,
    privacy: state.privacy,
    contact: {
      name,
      email,
      organization: state.contactOrg.trim() || null,
      comments: state.contactComments.trim() || null,
    },
  };
}
