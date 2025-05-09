import { clientFetcher } from "@/utils/core/fetch/fetch.client";

import ProfileApi from "./profile.shared";

const ClientProfileApi = new ProfileApi(clientFetcher);
export default ClientProfileApi;
