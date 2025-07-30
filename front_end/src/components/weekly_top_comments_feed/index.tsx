import { startOfWeek, format } from "date-fns";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerCommentsApi from "@/services/api/comments/comments.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";

import CommentsOfWeekContent from "./components/comments_of_week_content";

const AwaitedWeeklyTopCommentsFeed: FC<{
  searchParams: SearchParams;
}> = async ({ searchParams }) => {
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const startDate =
    typeof searchParams.start_date === "string"
      ? new Date(searchParams.start_date)
      : currentWeekStart;

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

export default WithServerComponentErrorBoundary(AwaitedWeeklyTopCommentsFeed);
