"use server";

import MiscApi, { ContactForm } from "@/services/misc";

export async function submitContactForm(data: ContactForm) {
  return await MiscApi.submitContactForm(data);
}
