// TODO: BE should probably return a field, that can be used as chart title
import { Post } from "@/types/post";

export function extractQuestionGroupName(title: string) {
  const match = title.match(/\((.*?)\)/);
  return match ? match[1] : title;
}

export function extractPostStatus(post: Post) {
  return {
    status: post.curation_status,
    closedAt: post.aim_to_close_at,
    resolvedAt: post.aim_to_resolve_at,
  };
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
