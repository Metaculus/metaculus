import "server-only";
import { SidebarItem } from "@/types/sidebar";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import MiscApi, { ContactForm, GetInTouchForm } from "./misc.shared";

class ServerMiscApiClass extends MiscApi {
  async submitContactForm(data: ContactForm) {
    return this.post("/contact-form/", data);
  }

  async submitGetInTouchForm(data: GetInTouchForm) {
    return this.post("/contact-form/services/", data);
  }

  async cancelBulletin(bulletinId: number) {
    return await this.post(`/cancel-bulletin/${bulletinId}/`, {});
  }

  async getSidebarItems(): Promise<SidebarItem[]> {
    return await this.get("/sidebar/");
  }

  async subscribeToNewsletter(email: string) {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    const listId = process.env.MAILJET_NEWSLETTER_ID;

    if (!apiKey || !secretKey || !listId) {
      throw new Error(
        "Mailjet configuration is missing. Please set MAILJET_API_KEY, MAILJET_SECRET_KEY, and MAILJET_NEWSLETTER_ID environment variables."
      );
    }

    const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
    const url = `https://api.mailjet.com/v3/REST/contactslist/${listId}/managecontact`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        Name: "",
        Properties: {},
        Action: "addnoforce",
        Email: email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to subscribe to newsletter: ${response.status} ${response.statusText}. ${errorText}`
      );
      throw new Error("Failed to subscribe to newsletter");
    }
  }
}

const serverMiscApi = new ServerMiscApiClass(serverFetcher);
export default serverMiscApi;
