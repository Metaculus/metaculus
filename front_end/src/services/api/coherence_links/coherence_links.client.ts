import CoherenceLinksApi from "@/services/api/coherence_links/coherence_links.shared";
import { clientFetcher } from "@/utils/core/fetch/fetch.client";

const ClientCoherenceLinksApi = new CoherenceLinksApi(clientFetcher);
export default ClientCoherenceLinksApi;
