// TODO: BE should probably return a field, that can be used as chart title
import { Post, ProjectPermissions } from "@/types/post";
import { Question } from "@/types/question";

export function extractQuestionGroupName(title: string) {
  const match = title.match(/\((.*?)\)/);
  return match ? match[1] : title;
}

export function extractPostStatus(post: Post) {
  if (post.scheduled_close_time && post.scheduled_resolve_time) {
    return {
      status: post.curation_status,
      actualCloseTime: post.scheduled_close_time,
      resolvedAt: post.scheduled_resolve_time,
    };
  }
  return null;
}

export function getNotebookSummary(
  markdown: string,
  width: number,
  height: number
) {
  const approxCharWidth = 10;
  const approxLineHeight = 20;

  const charsPerLine = Math.floor(width / approxCharWidth);
  const maxLines = Math.floor(height / approxLineHeight);
  const maxChars = charsPerLine * maxLines;
  markdown = markdown.replace(/\[.*?\]|\(.*?\)|\<.*?\>/g, "");
  const normalized = markdown
    .split("\n")
    .join(" ")
    .replace(/\[([^\]]+?)\]\([^)]+?\)/g, "$1");
  return (
    normalized.split("\n").join(" ").slice(0, maxChars) +
    (normalized.length > maxChars ? "..." : "")
  );
}

export function estimateReadingTime(markdown: string) {
  const words = markdown.split(/\s+/).length;
  const wordsPerMinute = 225;
  return Math.ceil(words / wordsPerMinute);
}

export function canResolveQuestion(
  question: Question,
  permission?: ProjectPermissions
) {
  return (
    !question.resolution &&
    permission &&
    [ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(permission)
  );
}
