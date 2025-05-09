"use server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import MiscServerApi from "@/services/api/misc/misc.server";
import { ContactForm } from "@/services/api/misc/misc.shared";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function submitContactForm(data: ContactForm) {
  return await MiscServerApi.submitContactForm(data);
}

export async function cancelBulletin(bulletinId: number) {
  return await MiscServerApi.cancelBulletin(bulletinId);
}

export async function getSocialProviders() {
  const { PUBLIC_APP_URL } = getPublicSettings();
  return await ServerAuthApi.getSocialProviders(
    `${PUBLIC_APP_URL}/accounts/social`
  );
}
