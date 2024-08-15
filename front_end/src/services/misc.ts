import { post } from "@/utils/fetch";

export type ContactForm = {
  email: string;
  message: string;
  subject: string;
};

class MiscApi {
  static async submitContactForm(data: ContactForm) {
    return post("/contact-form", data);
  }
}

export default MiscApi;
