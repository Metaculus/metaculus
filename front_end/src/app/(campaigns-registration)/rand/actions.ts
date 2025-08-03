"use server";

export type ZapierSubmissionResult = {
  success: boolean;
  error?: string;
};

export type ConfirmationResult = {
  success: boolean;
  error?: string;
};

export async function submitToZapierWebhook(
  email: string,
  username?: string,
  userEmail?: string,
  addToMailingList: boolean = false
): Promise<ZapierSubmissionResult> {
  try {
    const webhookUrl = process.env.RAND_ZAPIER_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("RAND_ZAPIER_WEBHOOK_URL environment variable not set");
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
        addToMailingList,
        timestamp: new Date().toISOString(),
        source: "rand_landing_page",
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

export async function confirmEmailRegistration(
  token: string,
  email: string
): Promise<ConfirmationResult> {
  try {
    // You'll need to set this environment variable for the confirmation webhook
    const confirmationWebhookUrl =
      process.env.RAND_CONFIRMATION_ZAPIER_WEBHOOK_URL;

    if (!confirmationWebhookUrl) {
      console.error(
        "RAND_CONFIRMATION_ZAPIER_WEBHOOK_URL environment variable not set"
      );
      return {
        success: false,
        error: "Configuration error. Please try again later.",
      };
    }

    const response = await fetch(confirmationWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        email,
        timestamp: new Date().toISOString(),
        source: "rand_confirmation_page",
      }),
    });

    if (!response.ok) {
      console.error(
        `Confirmation webhook failed with status: ${response.status}`
      );
      return {
        success: false,
        error:
          "Failed to confirm registration. The link may be expired or invalid.",
      };
    }

    const responseData = await response.json();

    // Check if Zapier returned a success status
    if (responseData.status === "success") {
      return { success: true };
    } else {
      return {
        success: false,
        error: "The confirmation link may be expired or already used.",
      };
    }
  } catch (error) {
    console.error("Error confirming email registration:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
