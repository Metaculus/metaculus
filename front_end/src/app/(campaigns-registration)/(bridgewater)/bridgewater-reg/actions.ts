"use server";

export type ZapierSubmissionResult = {
  success: boolean;
  error?: string;
};

export async function submitToZapierWebhook(
  email: string,
  username?: string,
  userEmail?: string
): Promise<ZapierSubmissionResult> {
  try {
    const webhookUrl = process.env.BRIDGEWATER_ZAPIER_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error(
        "BRIDGEWATER_ZAPIER_WEBHOOK_URL environment variable not set"
      );
      return {
        success: false,
        error: "Configuration error. Please try again later.",
      };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username: username || null,
        userEmail: userEmail || null,
        timestamp: new Date().toISOString(),
        source: "bridgewater_landing_page",
      }),
    });

    if (!response.ok) {
      console.error(`Zapier webhook failed with status: ${response.status}`);
      return {
        success: false,
        error: "Failed to submit registration. Please try again.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error submitting to Zapier webhook:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
