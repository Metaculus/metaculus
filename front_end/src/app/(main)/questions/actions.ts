"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { CoherenceLinksApiClass } from "@/services/api/coherence_links/coherence_links.server";
import ServerCommentsApi from "@/services/api/comments/comments.server";
import {
  CommentReportReason,
  CreateCommentParams,
  EditCommentParams,
  KeyFactorVoteParams,
  KeyFactorWritePayload,
  ToggleCMMCommentParams,
  VoteParams,
} from "@/services/api/comments/comments.shared";
import ServerPostsApi from "@/services/api/posts/posts.server";
import {
  ApprovePostParams,
  BoostDirection,
} from "@/services/api/posts/posts.shared";
import ServerQuestionsApi, {
  ForecastPayload,
  WithdrawalPayload,
} from "@/services/api/questions/questions.server";
import { CoherenceLink } from "@/types/coherence";
import { ErrorResponse } from "@/types/fetch";
import { NotebookPost, PostSubscription } from "@/types/post";
import { Tournament, TournamentType } from "@/types/projects";
import { Question } from "@/types/question";
import { DataParams, DeepPartial } from "@/types/utils";
import { VoteDirection } from "@/types/votes";
import { ApiError } from "@/utils/core/errors";

export async function votePost(postId: number, direction: VoteDirection) {
  return await ServerPostsApi.votePost(postId, direction);
}

export async function markPostAsRead(postId: number) {
  return await ServerPostsApi.sendPostReadEvent(postId);
}

export async function createQuestionPost<T>(body: T) {
  const post = await ServerPostsApi.createQuestionPost(body);
  return {
    post: post,
  };
}

export async function updatePost<T>(postId: number, body: T) {
  const post = await ServerPostsApi.updatePost(postId, body);
  revalidatePath("/questions/create/group/");
  return {
    post: post,
  };
}

export async function approvePost(postId: number, params: ApprovePostParams) {
  try {
    await ServerPostsApi.approvePost(postId, params);
    revalidatePath(`/questions/${postId}/`);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function removePostFromProject(postId: number, projectId: number) {
  try {
    await ServerPostsApi.removePostFromProject(postId, projectId);
    return null;
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function createForecasts(
  postId: number,
  forecasts: ForecastPayload[],
  revalidate = true
) {
  try {
    await ServerQuestionsApi.createForecasts(forecasts);
    if (revalidate) {
      revalidatePath(`/questions/${postId}`);
    }
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function withdrawForecasts(
  postId: number,
  withdrawals: WithdrawalPayload[],
  revalidate = true
) {
  try {
    await ServerQuestionsApi.withdrawForecasts(withdrawals);
    if (revalidate) {
      revalidatePath(`/questions/${postId}`);
    }
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function makeRepost(postId: number, projectId: number) {
  await ServerPostsApi.repost(postId, projectId);
}

export async function draftPost(postId: number, defaultProject: Tournament) {
  await ServerPostsApi.makeDraft(postId);

  if (defaultProject.type === TournamentType.Community) {
    return redirect(
      `/c/${defaultProject.slug}/settings/?mode=questions&status=pending`
    );
  }

  return redirect("/questions/?status=pending");
}

export async function submitPostForReview(postId: number) {
  return await ServerPostsApi.submitForReview(postId);
}

export async function rejectPost(postId: number) {
  return await ServerPostsApi.rejectPost(postId);
}

export async function deletePost(postId: number) {
  await ServerPostsApi.deletePost(postId);

  return redirect("/questions/");
}

export async function sendBackToReview(postId: number) {
  return await ServerPostsApi.sendBackToReview(postId);
}

export async function updateNotebook(
  postId: number,
  markdown: string,
  title: string
) {
  const response = await ServerPostsApi.updatePost<
    NotebookPost,
    DeepPartial<NotebookPost>
  >(postId, {
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
    const { post_id } = await ServerQuestionsApi.resolve(
      questionId,
      resolution,
      actualResolveTime
    );

    revalidatePath(`/questions/${post_id}`);

    return;
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function unresolveQuestion(questionId: number) {
  try {
    const { post_id } = await ServerQuestionsApi.unresolve(questionId);

    revalidatePath(`/questions/${post_id}`);

    return;
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function uploadImage(formData: FormData) {
  try {
    return await ServerPostsApi.uploadImage(formData);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function softDeleteComment(commentId: number) {
  try {
    return await ServerCommentsApi.softDeleteComment(commentId);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function editComment(commentData: EditCommentParams) {
  try {
    return await ServerCommentsApi.editComment(commentData);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function createComment(commentData: CreateCommentParams) {
  try {
    return await ServerCommentsApi.createComment(commentData);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function addKeyFactorsToComment(
  commentId: number,
  keyFactors: KeyFactorWritePayload[]
) {
  try {
    return await ServerCommentsApi.addKeyFactorsToComment(
      commentId,
      keyFactors
    );
  } catch (err) {
    const error = err as ApiError;

    return {
      errors: error.data,
    };
  }
}

export async function deleteKeyFactor(keyFactorId: number) {
  try {
    return await ServerCommentsApi.deleteKeyFactor(keyFactorId);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function commentTogglePin(commentId: number, pin: boolean) {
  return await ServerCommentsApi.togglePin(commentId, pin);
}

export async function voteComment(voteData: VoteParams) {
  return await ServerCommentsApi.voteComment(voteData);
}

export async function voteKeyFactor(voteData: KeyFactorVoteParams) {
  return await ServerCommentsApi.voteKeyFactor(voteData);
}

export async function toggleCMMComment(cmmParam: ToggleCMMCommentParams) {
  return await ServerCommentsApi.toggleCMMComment(cmmParam);
}

export async function reportComment(
  commentId: number,
  reason: CommentReportReason
) {
  return await ServerCommentsApi.report(commentId, reason);
}

export async function changePostActivityBoost(
  postId: number,
  direction: BoostDirection
) {
  return await ServerPostsApi.changePostActivityBoost(postId, direction);
}

export async function removeRelatedArticle(articleId: number) {
  await ServerPostsApi.removeRelatedArticle(articleId);
  revalidateTag("related-articles");
}

export async function changePostSubscriptions(
  postId: number,
  subscriptions: PostSubscription[],
  revalidate: boolean = false
) {
  const response = await ServerPostsApi.updateSubscriptions(
    postId,
    subscriptions
  );

  if (revalidate) {
    revalidatePath(`/questions/${postId}`);
    revalidatePath("/accounts/settings");
  }
  return response;
}

export async function getPostZipData(params: DataParams) {
  const blob = await ServerPostsApi.getPostZipData(params);
  const arrayBuffer = await blob.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");

  return `data:application/octet-stream;base64,${base64String}`;
}

export async function emailData(params: DataParams) {
  return await ServerPostsApi.emailData(params);
}

export async function createCoherenceLink(
  question1: Question,
  question2: Question,
  direction: number,
  strength: number,
  type: string
): Promise<null | ErrorResponse> {
  try {
    await CoherenceLinksApiClass.createCoherenceLink({
      question1_id: question1.id,
      question2_id: question2.id,
      direction,
      strength,
      type,
    });
    return null;
  } catch (err) {
    return ApiError.isApiError(err) ? err.data : {};
  }
}

export async function deleteCoherenceLink(link: CoherenceLink) {
  try {
    return await CoherenceLinksApiClass.deleteCoherenceLink(link.id);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function setExcludedFromWeekTopComments(
  commentId: number,
  excluded: boolean
) {
  return await ServerCommentsApi.setCommentExcludedFromWeekTop(
    commentId,
    excluded
  );
}
