import "server-only";
import {
  NotebookPost,
  PostSubscription,
  PostWithForecasts,
} from "@/types/post";
import { VoteDirection, VoteResponse } from "@/types/votes";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import PostsApi, { ApprovePostParams, BoostDirection } from "./posts.shared";

class ServerPostsApiClass extends PostsApi {
  async removePostFromProject(postId: number, projectId: number) {
    await this.post(`/posts/${postId}/remove_from_project/`, {
      project_id: projectId,
    });
  }

  async createQuestionPost<T extends PostWithForecasts | NotebookPost, B>(
    body: B
  ): Promise<T> {
    return await this.post(`/posts/create/`, body);
  }

  async updatePost<T extends PostWithForecasts | NotebookPost, B>(
    id: number,
    body: B
  ): Promise<T> {
    return await this.put(`/posts/${id}/update/`, body);
  }

  async submitForReview(id: number) {
    return await this.post(`/posts/${id}/submit-for-review/`, {});
  }

  async rejectPost(id: number) {
    return await this.post(`/posts/${id}/reject/`, {});
  }

  async deletePost(id: number) {
    return await this.delete(`/posts/${id}/delete/`, {});
  }

  async sendBackToReview(id: number) {
    return await this.post(`/posts/${id}/send-back-to-review/`, {});
  }

  async makeDraft(id: number) {
    return await this.post(`/posts/${id}/make-draft/`, {});
  }

  async approvePost(id: number, params: ApprovePostParams) {
    return await this.post(`/posts/${id}/approve/`, params);
  }

  async votePost(id: number, direction: VoteDirection): Promise<VoteResponse> {
    return await this.post<VoteResponse>(`/posts/${id}/vote/`, { direction });
  }

  async uploadImage(formData: FormData): Promise<{ url: string }> {
    return await this.post<{ url: string }, FormData>(
      "/posts/upload-image/",
      formData
    );
  }

  async sendPostReadEvent(postId: number) {
    return this.post(`/posts/${postId}/read/`, {});
  }

  async changePostActivityBoost(postId: number, direction: BoostDirection) {
    return this.post<{ score: number; score_total: number }>(
      `/posts/${postId}/boost/`,
      {
        direction,
      }
    );
  }

  async updateSubscriptions(postId: number, subscriptions: PostSubscription[]) {
    return this.post<PostSubscription[], PostSubscription[]>(
      `/posts/${postId}/subscriptions/`,
      subscriptions
    );
  }

  async removeRelatedArticle(articleId: number) {
    return await this.post(`/itn-articles/${articleId}/remove/`, {});
  }

  async repost(postId: number, projectId: number) {
    return this.post(`/posts/${postId}/repost/`, { project_id: projectId });
  }

  async savePrivateNote(postId: number, text: string) {
    return this.post(`/posts/${postId}/private-note/`, { text });
  }
}

const ServerPostsApi = new ServerPostsApiClass(serverFetcher);
export default ServerPostsApi;
