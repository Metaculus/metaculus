import { ApiService } from "@/services/api/api_service";
import { GlobalTrackRecord } from "@/types/track_record";

class TrackRecordApi extends ApiService {
  async getGlobalTrackRecord() {
    return await this.get<GlobalTrackRecord>("/metaculus_track_record/");
  }
}

export default TrackRecordApi;
