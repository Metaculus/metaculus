import { clientFetcher } from "@/utils/core/fetch/fetch.client";

import MiscApi from "./misc.shared";

const MiscClientApi = new MiscApi(clientFetcher);
export default MiscClientApi;
