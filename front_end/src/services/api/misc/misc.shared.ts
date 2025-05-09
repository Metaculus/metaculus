import { ApiService } from "@/services/api/api_service";

export type ContactForm = {
  email: string;
  message: string;
  subject: string;
};

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
}

export default MiscApi;
