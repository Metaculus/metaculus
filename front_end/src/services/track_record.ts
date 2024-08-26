import { GlobalTrackRecord } from "@/types/track_record";
import { get } from "@/utils/fetch";

class TrackRecordApi {
  static async getGlobalTrackRecord() {
    return await get<GlobalTrackRecord>("/metaculus_track_record");
  }
}

export default TrackRecordApi;
