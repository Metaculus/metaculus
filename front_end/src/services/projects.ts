import { Category, Tag, Topic, Tournament } from "@/types/projects";
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

  static async getCategories(): Promise<Category[]> {
    try {
      return await get<Category[]>("/projects/categories");
    } catch (err) {
      console.error("Error getting categories:", err);
      return [];
    }
  }

  static async getTags(): Promise<Tag[]> {
    try {
      return await get<Tag[]>("/projects/tags");
    } catch (err) {
      console.error("Error getting tags:", err);
      return [];
    }
  }

  static async getTournaments(): Promise<Tournament[]> {
    try {
      return await get<Tournament[]>("/projects/tournaments");
    } catch (err) {
      console.error("Error getting tournaments:", err);
      return [];
    }
  }

  static async getSlugTournament(slug: string): Promise<Tournament | null> {
    try {
      return await get<Tournament>(`/projects/tournaments/${slug}`);
    } catch (err) {
      console.error("Error getting tournament:", err);
      return null;
    }
  }
}

export default ProjectsApi;
