import { clientFetcher } from "@/utils/core/fetch/fetch.client";

import ProjectsApi from "./projects.shared";

const ClientProjectsApi = new ProjectsApi(clientFetcher);
export default ClientProjectsApi;
