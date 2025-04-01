"use server";

import { FetchError } from "@/types/fetch";
import { CurrentUser } from "@/types/users";

import { getLastVerificationSession, saveVerificationSession } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const stripe = require("stripe");

export type StripeVerificationResponse = {
  url?: string;
  error?: string;
};

export type VerificationSession = {
  id: string;
  status: string;
  metadata: {
    user_id: string;
  };
  url: string;
};

export async function getVerificationSession(
  user: CurrentUser | null
): Promise<VerificationSession | undefined> {
  try {
    if (!user) {
      return undefined;
    }

    const verificationSessionId = await getLastVerificationSession(user);

    if (!verificationSessionId) {
      return undefined;
    }

    const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

    const stripeSession =
      await stripeClient.identity.verificationSessions.retrieve(
        verificationSessionId
      );

    const verificationSession = {
      id: stripeSession.id,
      status: stripeSession.status,
      metadata: stripeSession.metadata,
      url: stripeSession.url,
    };

    return verificationSession;
  } catch {
    return undefined;
  }
}

export async function initiateStripeVerification(
  user: CurrentUser
): Promise<StripeVerificationResponse> {
  try {
    const bw_registation_data = user.registered_campaigns.find(
      (c) => c.key === "bw_q4_2024"
    ) as { details: { full_name: string } } | undefined;

    const bw_reg_full_name = bw_registation_data?.details?.full_name;
    const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
    const verificationSession =
      await stripeClient.identity.verificationSessions.create({
        type: "document",
        options: {
          document: {
            require_id_number: true,
            require_matching_selfie: true,
          },
          email: {
            require_verification: true,
          },
        },
        provided_details: {
          email: user.email,
        },
        metadata: {
          user_id: `${user.id}`,
          username: `${user.username}`,
          email: `${user.email}`,
          bw_reg_full_name: `${bw_reg_full_name}`,
        },
        return_url: `${process.env.PUBLIC_APP_URL}/id-verification`,
      });

    await saveVerificationSession(verificationSession, user);

    return { url: verificationSession.url };
  } catch (err) {
    console.error("Stripe verification error", err);
    const error = err as FetchError;
    return {
      error: error.message || "Failed to initiate verification",
    };
  }
}
