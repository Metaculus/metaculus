import { startOfWeek, format, getDay, addDays, parse } from "date-fns";
import { redirect } from "next/navigation";
import { FC } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";

import CommentsOfWeekContent from "./components/comments_of_week_content";
import { WEEK_START_DAY } from "./components/constants";

const AwaitedWeeklyTopCommentsFeed: FC<{
  searchParams: SearchParams;
}> = async ({ searchParams }) => {
  const currentWeekStart = startOfWeek(new Date(), {
    weekStartsOn: WEEK_START_DAY,
  });
  const defaultWeekStart = addDays(currentWeekStart, -14);
  const defaultWeekStartStr = format(defaultWeekStart, "yyyy-MM-dd");

  const startDateStr =
    typeof searchParams.start_date === "string"
      ? searchParams.start_date
      : defaultWeekStartStr;

  // Redirect to the last Sunday if the provided date is not a Sunday
  if (
    typeof searchParams.start_date === "string" &&
    getDay(parse(startDateStr, "yyyy-MM-dd", new Date())) !== WEEK_START_DAY
  ) {
    const lastSunday = format(
      startOfWeek(parse(startDateStr, "yyyy-MM-dd", new Date()), {
        weekStartsOn: WEEK_START_DAY,
      }),
      "yyyy-MM-dd"
    );
    redirect(
      `/questions/?weekly_top_comments=true&start_date=${format(lastSunday, "yyyy-MM-dd")}`
    );
  }

  const requests = [
    ServerCommentsApi.getCommentsOfWeek(startDateStr),
    ServerProfileApi.getMyProfile(),
  ] as const;

  const [commentEntries, currentUser] = await Promise.all(requests);

  return (
    <CommentsOfWeekContent
      entries={commentEntries}
      weekStartStr={startDateStr}
      currentUser={currentUser}
    />
  );
};

export default AwaitedWeeklyTopCommentsFeed;
