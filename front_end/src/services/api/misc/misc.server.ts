import "server-only";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import MiscApi, { ContactForm } from "./misc.shared";

class ServerMiscApiClass extends MiscApi {
  async submitContactForm(data: ContactForm) {
    return this.post("/contact-form/", data);
  }
  async cancelBulletin(bulletinId: number) {
    return await this.post(`/cancel-bulletin/${bulletinId}/`, {});
  }
}

const MiscServerApi = new ServerMiscApiClass(serverFetcher);
export default MiscServerApi;
