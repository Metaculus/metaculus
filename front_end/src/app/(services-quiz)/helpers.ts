import { ServicesQuizAnswersState } from "./components/quiz_state/services_quiz_answers_provider";

export function aggregateServicesQuizAnswers(state: ServicesQuizAnswersState) {
  return {
    category: state.category,
    challenges: state.selectedChallenges,
    notes: state.notes.trim() || null,
    timing: state.timing,
    whoForecasts: state.whoForecasts,
    privacy: state.privacy,
    contact: {
      name: state.contactName.trim() || null,
      email: state.contactEmail.trim() || null,
    },
  };
}
