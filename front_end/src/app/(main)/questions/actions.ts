"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { POSTS_PER_PAGE } from "@/constants/posts_feed";
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
import QuestionsApi, {
  ForecastPayload,
  WithdrawalPayload,
} from "@/services/questions";
import { FetchError } from "@/types/fetch";
import { PostSubscription } from "@/types/post";
import { Tournament, TournamentType } from "@/types/projects";
import { VoteDirection } from "@/types/votes";

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
  return {
    newPosts: response.results,
    hasNextPage: !!response.next && response.results.length >= POSTS_PER_PAGE,
  };
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
  return await PostsApi.votePost(postId, direction);
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

export async function approvePost(postId: number, params: ApprovePostParams) {
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
  forecasts: ForecastPayload[],
  revalidate = true
) {
  try {
    const response = await QuestionsApi.createForecasts(forecasts);
    revalidate && revalidatePath(`/questions/${postId}`);
  } catch (err) {
    const error = err as FetchError;

    return error.data;
  }
}

export async function withdrawForecasts(
  postId: number,
  withdrawals: WithdrawalPayload[],
  revalidate = true
) {
  try {
    const response = await QuestionsApi.withdrawForecasts(withdrawals);
    revalidate && revalidatePath(`/questions/${postId}`);
  } catch (err) {
    const error = err as FetchError;

    return error.data;
  }
}

export async function getPost(postId: number) {
  const response = await PostsApi.getPost(postId);
  return response;
}

export async function getQuestion(questionId: number) {
  const response = await PostsApi.getQuestion(questionId);
  return response;
}

export async function draftPost(postId: number, defaultProject: Tournament) {
  await PostsApi.makeDraft(postId);

  if (defaultProject.type === TournamentType.Community) {
    return redirect(
      `/c/${defaultProject.slug}/settings/?mode=questions&status=pending`
    );
  }

  return redirect("/questions/?status=pending");
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

export async function unresolveQuestion(questionId: number) {
  try {
    const { post_id } = await QuestionsApi.unresolve(questionId);

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
  return await CommentsApi.voteComment(voteData);
}

export async function toggleCMMComment(cmmParam: ToggleCMMCommentParams) {
  return await CommentsApi.toggleCMMComment(cmmParam);
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

  if (revalidate) {
    revalidatePath(`/questions/${postId}`);
    revalidatePath("/accounts/settings");
  }
  return response;
}
