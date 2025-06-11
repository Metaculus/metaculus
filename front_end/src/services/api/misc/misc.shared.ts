import { ApiService } from "@/services/api/api_service";

export type ContactForm = {
  email: string;
  message: string;
  subject: string;
};

export type GetInTouchForm = {
  name: string;
  email: string;
  organization?: string;
  service: string;
};

export interface SiteStats {
  predictions: number;
  questions: number;
  resolved_questions: number;
  years_of_predictions: number;
}

class MiscApi extends ApiService {
  async getBulletins() {
    const resp = await this.get<{
      bulletins: {
        text: string;
        id: number;
      }[];
    }>("/get-bulletins/");
    return resp?.bulletins;
  }

  async getSiteStats() {
    return await this.get<SiteStats>("/get-site-stats/");
  }
}

export default MiscApi;
