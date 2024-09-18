"use server";

import { revalidatePath } from "next/cache";

import CommentsApi, {
  CommentReportReason,
  CreateCommentParams,
  EditCommentParams,
  getCommentsParams,
  ToggleCMMCommentParams,
  VoteCommentParams,
} from "@/services/comments";
import PostsApi, { ApprovePostParams, PostsParams } from "@/services/posts";
import ProfileApi from "@/services/profile";
import QuestionsApi, { ForecastPayload } from "@/services/questions";
import { FetchError } from "@/types/fetch";
import { PostStatus, PostSubscription } from "@/types/post";
import { VoteDirection } from "@/types/votes";
import { useAuth } from "@/contexts/auth_context";

export async function fetchMorePosts(
  filters: PostsParams,
  offset: number,
  limit: number
) {
  const response = await PostsApi.getPostsWithCP({
    ...filters,
    offset,
    limit,
  });
  return response.results;
}

export async function fetchPosts(
  filters: PostsParams,
  offset: number,
  limit: number
) {
  const response = await PostsApi.getPostsWithCP({
    ...filters,
    offset,
    limit,
  });
  return { questions: response.results, count: response.count };
}

export async function fetchEmbedPosts(search: string) {
  const response = await PostsApi.getPostsWithCP({
    search: search || undefined,
    limit: search ? undefined : 10,
  });

  return response.results;
}

export async function votePost(postId: number, direction: VoteDirection) {
  try {
    return await PostsApi.votePost(postId, direction);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function markPostAsRead(postId: number) {
  return await PostsApi.sendPostReadEvent(postId);
}

export async function createQuestionPost(body: any) {
  const post = await PostsApi.createQuestionPost(body);
  return {
    post: post,
  };
}

export async function updatePost(postId: number, body: any) {
  const post = await PostsApi.updatePost(postId, body);
  revalidatePath("/questions/create/group/");
  return {
    post: post,
  };
}

export async function approvePost(postId: number, params: ApprovePostParams[]) {
  try {
    await PostsApi.approvePost(postId, params);
    revalidatePath(`/questions/${postId}/`);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function removePostFromProject(postId: number, projectId: number) {
  try {
    const resp = await PostsApi.removePostFromProject(postId, projectId);
    return null;
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function createForecasts(
  postId: number,
  forecasts: ForecastPayload[]
) {
  try {
    const response = await QuestionsApi.createForecasts(forecasts);
    revalidatePath(`/questions/${postId}`);
  } catch (err) {
    const error = err as FetchError;

    return error.data;
  }
}

export async function getPost(postId: number) {
  const response = await PostsApi.getPost(postId);
  return response;
}

export async function draftPost(postId: number) {
  return await PostsApi.makeDraft(postId);
}

export async function submitPostForReview(postId: number) {
  return await PostsApi.submitForReview(postId);
}

export async function updateNotebook(
  postId: number,
  markdown: string,
  title: string
) {
  const response = await PostsApi.updatePost(postId, {
    title: title,
    notebook: {
      markdown,
    },
  });
  revalidatePath(`/notebooks/${postId}`);

  return response;
}

export async function resolveQuestion(
  questionId: number,
  resolution: string,
  actualResolveTime: string
) {
  try {
    const { post_id } = await QuestionsApi.resolve(
      questionId,
      resolution,
      actualResolveTime
    );

    revalidatePath(`/questions/${post_id}`);

    return;
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function uploadImage(formData: FormData) {
  try {
    return await PostsApi.uploadImage(formData);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function getComments(commentsParams: getCommentsParams) {
  try {
    return await CommentsApi.getComments(commentsParams);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function softDeleteComment(commentId: number) {
  try {
    return await CommentsApi.softDeleteComment(commentId);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function editComment(commentData: EditCommentParams) {
  try {
    return await CommentsApi.editComment(commentData);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function createComment(commentData: CreateCommentParams) {
  try {
    return await CommentsApi.createComment(commentData);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function voteComment(voteData: VoteCommentParams) {
  try {
    return await CommentsApi.voteComment(voteData);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function toggleCMMComment(cmmParam: ToggleCMMCommentParams) {
  try {
    return await CommentsApi.toggleCMMComment(cmmParam);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function reportComment(
  commentId: number,
  reason: CommentReportReason
) {
  return await CommentsApi.report(commentId, reason);
}

export async function searchUsers(query: string) {
  try {
    return await ProfileApi.searchUsers(query);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function changePostActivityBoost(postId: number, score: number) {
  return await PostsApi.changePostActivityBoost(postId, score);
}

export async function removeRelatedArticle(articleId: number) {
  return await PostsApi.removeRelatedArticle(articleId);
}

export async function changePostSubscriptions(
  postId: number,
  subscriptions: PostSubscription[],
  revalidate: boolean = false
) {
  const response = await PostsApi.updateSubscriptions(postId, subscriptions);

  revalidate && revalidatePath(`/questions/${postId}`);
  return response;
}
