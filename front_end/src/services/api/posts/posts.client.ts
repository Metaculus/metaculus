import { clientFetcher } from "@/utils/core/fetch/fetch.client";

import PostsApi from "./posts.shared";

const ClientPostsApi = new PostsApi(clientFetcher);
export default ClientPostsApi;
