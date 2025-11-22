import { ApiService } from "@/services/api/api_service";
import { encodeQueryParams } from "@/utils/navigation";

export type ContactForm = {
  email: string;
  message: string;
  subject: string;
};

export type GetInTouchForm = {
  name: string;
  email: string;
  organization?: string;
  message?: string;
  service: string;
};

export interface SiteStats {
  predictions: number;
  questions: number;
  resolved_questions: number;
  years_of_predictions: number;
}

type BulletinParams = {
  post_id?: number;
  project_slug?: string;
};

class MiscApi extends ApiService {
  async getBulletins(params?: BulletinParams) {
    const queryParams = encodeQueryParams(params ?? {});
    const resp = await this.get<{
      bulletins: {
        text: string;
        id: number;
      }[];
    }>(`/get-bulletins/${queryParams}`);
    return resp?.bulletins;
  }

  async getSiteStats() {
    return await this.get<SiteStats>("/get-site-stats/");
  }
}

export default MiscApi;
