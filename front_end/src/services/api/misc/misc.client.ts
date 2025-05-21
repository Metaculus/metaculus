import { clientFetcher } from "@/utils/core/fetch/fetch.client";

import MiscApi from "./misc.shared";

const ClientMiscApi = new MiscApi(clientFetcher);
export default ClientMiscApi;
