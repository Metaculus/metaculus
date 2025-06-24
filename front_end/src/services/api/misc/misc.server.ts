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
}

const serverMiscApi = new ServerMiscApiClass(serverFetcher);
export default serverMiscApi;
