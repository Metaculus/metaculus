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

  private getMailjetConfig() {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    const listId = process.env.MAILJET_NEWSLETTER_ID;

    if (!apiKey || !secretKey || !listId) {
      throw new Error(
        "Mailjet configuration is missing. Please set MAILJET_API_KEY, MAILJET_SECRET_KEY, and MAILJET_NEWSLETTER_ID environment variables."
      );
    }

    return {
      auth: Buffer.from(`${apiKey}:${secretKey}`).toString("base64"),
      listId,
    };
  }

  async isNewsletterSubscribed(email: string): Promise<boolean> {
    const { auth, listId } = this.getMailjetConfig();
    const url = `https://api.mailjet.com/v3/REST/contact/${encodeURIComponent(email)}/getcontactslists`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return false;
      }
      console.error(
        `Failed to check newsletter subscription: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const data = await response.json();
    const newsletterListId = parseInt(listId, 10);

    return (
      Array.isArray(data?.Data) &&
      data.Data.some(
        (list: { ListID: number; IsUnsub: boolean }) =>
          list.ListID === newsletterListId && !list.IsUnsub
      )
    );
  }

  async unsubscribeFromNewsletter(email: string) {
    const { auth, listId } = this.getMailjetConfig();
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
        Action: "unsub",
        Email: email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const redactedError = errorText.replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        "[redacted-email]"
      );
      console.error(
        `Failed to unsubscribe from newsletter: ${response.status} ${response.statusText}. ${redactedError}`
      );
      throw new Error("Failed to unsubscribe from newsletter");
    }
  }

  async subscribeToNewsletter(email: string) {
    const { auth, listId } = this.getMailjetConfig();
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
        Action: "addforce",
        Email: email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const redactedError = errorText.replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        "[redacted-email]"
      );
      console.error(
        `Failed to subscribe to newsletter: ${response.status} ${response.statusText}. ${redactedError}`
      );
      throw new Error("Failed to subscribe to newsletter");
    }
  }
}

const serverMiscApi = new ServerMiscApiClass(serverFetcher);
export default serverMiscApi;
