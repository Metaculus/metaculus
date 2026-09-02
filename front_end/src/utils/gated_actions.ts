import { GatedActionInput } from "@/types/gated_actions";

export type GatedActionWire = {
  type: string;
  payload: unknown;
};

/**
 * Marks a signup as having come through the email-capture drawer rather than
 * the ordinary signup modal. The backend starts these accounts in the consumer
 * view (authentication/social_pipeline.py).
 */
export const EMAIL_CAPTURE_SIGNUP_SOURCE = "email_capture";

/**
 * Maps a client-side gated action to the backend envelope. Forecast payloads
 * use the same wire shape as ServerQuestionsApi.createForecasts. Shared by the
 * email-link request and the social code exchange.
 */
export const mapGatedActionToWire = (
  action: GatedActionInput
): GatedActionWire => {
  if (action.type === "forecast") {
    return {
      type: "forecast",
      payload: action.payload.map(
        ({ questionId, forecastData, distributionInput, forecastEndTime }) => ({
          question: questionId,
          continuous_cdf: forecastData.continuousCdf,
          probability_yes: forecastData.probabilityYes,
          probability_yes_per_category: forecastData.probabilityYesPerCategory,
          distribution_input: distributionInput,
          // May arrive as an ISO string when rehydrated from localStorage
          end_time: forecastEndTime,
        })
      ),
    };
  }
  return { type: action.type, payload: action.payload };
};
