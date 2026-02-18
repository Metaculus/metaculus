"use server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import serverMiscApi from "@/services/api/misc/misc.server";
import { ContactForm } from "@/services/api/misc/misc.shared";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function submitContactForm(data: ContactForm) {
  return await serverMiscApi.submitContactForm(data);
}

export async function cancelBulletin(bulletinId: number) {
  return await serverMiscApi.cancelBulletin(bulletinId);
}

export async function subscribeToNewsletter(email: string) {
  return await serverMiscApi.subscribeToNewsletter(email);
}

// Unlike subscribeToNewsletter, unsubscribeFromNewsletter and checkNewsletterSubscription requires
// the user to be authenticated to avoid scenarios where a malicious user could unsubscribe someone
// else from the newsletter.
// The subscribeToNewsletter action does not require the user to be authenticated as we want
// to allow unauthenticated users to subscribe to the newsletter.
export async function unsubscribeFromNewsletter() {
  const user = await ServerProfileApi.getMyProfile();
  if (!user) throw new Error("Not authenticated");
  return await serverMiscApi.unsubscribeFromNewsletter(user.email);
}

export async function checkNewsletterSubscription() {
  const user = await ServerProfileApi.getMyProfile();
  if (!user) throw new Error("Not authenticated");
  return await serverMiscApi.isNewsletterSubscribed(user.email);
}

export async function getSocialProviders() {
  const { PUBLIC_APP_URL } = getPublicSettings();
  return await ServerAuthApi.getSocialProviders(
    `${PUBLIC_APP_URL}/accounts/social`
  );
}
