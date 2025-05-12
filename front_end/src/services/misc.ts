import { post, get } from "@/utils/core/fetch";

export type ContactForm = {
  email: string;
  message: string;
  subject: string;
};

export interface SiteStats {
  predictions: number;
  questions: number;
  resolved_questions: number;
  years_of_predictions: number;
}

class MiscApi {
  static async submitContactForm(data: ContactForm) {
    return post("/contact-form/", data);
  }
  static async getBulletins() {
    const resp = await get<{
      bulletins: {
        text: string;
        id: number;
      }[];
    }>("/get-bulletins/");
    return resp.bulletins;
  }
  static async cancelBulletin(bulletinId: number) {
    const resp = await post(`/cancel-bulletin/${bulletinId}/`, {});
    return resp;
  }
  static async getSiteStats() {
    const resp = await get<SiteStats>("/get-site-stats/");
    return resp;
  }
}

export default MiscApi;
