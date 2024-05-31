import { Topic } from "@/types/projects";
import { get } from "@/utils/fetch";

class ProjectsApi {
  static async getTopics(): Promise<Topic[]> {
    try {
      return await get<Topic[]>("/projects/topics");
    } catch (err) {
      console.error("Error getting topics:", err);
      return [];
    }
  }
}

export default ProjectsApi;
