"use server";

import AuthApi from "@/services/auth";
import MiscApi, { ContactForm } from "@/services/misc";
import { getPublicSettings } from "@/utils/public-settings";

export async function submitContactForm(data: ContactForm) {
  return await MiscApi.submitContactForm(data);
}

export async function getBulletins() {
  return await MiscApi.getBulletins();
}

export async function cancelBulletin(bulletinId: number) {
  return await MiscApi.cancelBulletin(bulletinId);
}

export async function getSocialProviders() {
  const { PUBLIC_APP_URL } = getPublicSettings();
  return await AuthApi.getSocialProviders(`${PUBLIC_APP_URL}/accounts/social`);
}
