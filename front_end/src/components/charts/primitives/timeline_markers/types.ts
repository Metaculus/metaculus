export type ActivityType = "news" | "insight" | "comment";

export type GroupTimelineMarker = {
  id: string;
  timestamp: number;
  activityId?: string;
  label?: string;
  dateLabel?: string;
  type?: ActivityType;
};
