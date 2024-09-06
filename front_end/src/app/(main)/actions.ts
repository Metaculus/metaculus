"use server";

import MiscApi, { ContactForm } from "@/services/misc";

export async function submitContactForm(data: ContactForm) {
  return await MiscApi.submitContactForm(data);
}

export async function getBulletins() {
  return await MiscApi.getBulletins();
}

export async function cancelBulletin(bulletinId: number) {
  return await MiscApi.cancelBulletin(bulletinId);
}
