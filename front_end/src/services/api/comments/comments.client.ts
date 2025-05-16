import { clientFetcher } from "@/utils/core/fetch/fetch.client";

import CommentsApi from "./comments.shared";

const ClientCommentsApi = new CommentsApi(clientFetcher);
export default ClientCommentsApi;
