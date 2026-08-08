import { ContactSubjectType } from "@/constants/contact";
import { ApiService } from "@/services/api/api_service";
import { CombinedFeedTile } from "@/types/projects";

export type ContactForm = {
  email: string;
  message: string;
  subject: ContactSubjectType;
  source_url?: string;
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

export type BulletinItem = {
  text: string;
  id: number;
};

class MiscApi extends ApiService {
  async getBulletins(): Promise<BulletinItem[]> {
    const resp = await this.get<{
      bulletins: BulletinItem[];
    }>("/get-bulletins/", undefined, {
      passAuthHeader: false,
    });
    return resp.bulletins;
  }

  async getDismissedBulletinIds() {
    const resp = await this.get<{
      dismissed_bulletin_ids: number[];
    }>("/get-dismissed-bulletin-ids/");
    return resp.dismissed_bulletin_ids;
  }

  async getSiteStats() {
    return await this.get<SiteStats>("/get-site-stats/", {
      next: {
        revalidate: 60 * 60 * 24, // 24 hours
      },
    });
  }

  async getCombinedFeedTiles(): Promise<CombinedFeedTile[]> {
    return await this.get<CombinedFeedTile[]>("/ad-tiles/");
  }

  async dismissFeedTile(dismissId: string): Promise<void> {
    await this.post(`/ad-tiles/${encodeURIComponent(dismissId)}/dismiss/`, {});
  }
}

export default MiscApi;
