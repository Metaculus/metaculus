import { startOfWeek, format, getDay } from "date-fns";
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
  const startDate =
    typeof searchParams.start_date === "string"
      ? new Date(searchParams.start_date)
      : currentWeekStart;

  // Redirect to the last Sunday if the provided date is not a Sunday
  if (
    typeof searchParams.start_date === "string" &&
    getDay(startDate) !== WEEK_START_DAY
  ) {
    const lastSunday = startOfWeek(startDate, {
      weekStartsOn: WEEK_START_DAY,
    });
    redirect(
      `/questions/?weekly_top_comments=true&start_date=${format(lastSunday, "yyyy-MM-dd")}`
    );
  }

  const requests = [
    ServerCommentsApi.getCommentsOfWeek(format(startDate, "yyyy-MM-dd")),
    ServerProfileApi.getMyProfile(),
  ] as const;

  const [commentsData, currentUser] = await Promise.all(requests);

  return (
    <CommentsOfWeekContent
      comments={commentsData}
      weekStart={startDate}
      currentUser={currentUser}
    />
  );
};

export default AwaitedWeeklyTopCommentsFeed;
