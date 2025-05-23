import "server-only";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import TrackRecordApi from "./track_record.shared";

const ServerTrackRecordApi = new TrackRecordApi(serverFetcher);
export default ServerTrackRecordApi;
