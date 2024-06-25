import {
  Question,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { VoteDirection } from "@/types/votes";

export type Resolution = "yes" | "no";

export enum PostForecastType {
  Conditional = "conditional",
  Group = "group_of_questions",
}

export enum ProjectPermissions {
  VIEWER = "viewer",
  FORECASTER = "forecaster",
  CURATOR = "curator",
  ADMIN = "admin",
  CREATOR = "creator",
}

export enum NotebookType {
  Notebook = "notebook",
}

export type ForecastType = PostForecastType | QuestionType | NotebookType;

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

export type Topic = {
  id: number;
  name: string;
  slug: string;
  description: string;
  emoji: string;
};

export type PostVote = {
  score: number;
  user_vote: VoteDirection;
};

export enum PostStatus {
  DRAFT = "draft",
  PENDING = "pending",
  REJECTED = "rejected",
  APPROVED = "approved",
  CLOSED = "closed",
  RESOLVED = "resolved",
  DELETED = "deleted",
}

export type PostCondition = {
  id: number;
  title: string;
  description: string;
  closed_at: string;
  resolved_at: string;
  curation_status: PostStatus;
  resolution: Resolution | null;
};

export type PostConditional<QT> = {
  id: number;
  condition: PostCondition;
  question_yes: QT;
  question_no: QT;
};

export type Notebook = {
  markdown: string;
  type: string;
};

export type Post<QT = Question> = {
  id: number;
  projects: {
    category: Category[];
    topic: Topic[];
  };
  title: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  approved_at: string | null;
  vote: PostVote;
  nr_forecasters: number;
  author_username: string;
  author_id: number;
  question?: QT;
  conditional?: PostConditional<QT>;
  group_of_questions: {
    id: number;
    questions: QT[];
  };
  notebook?: Notebook;
  curation_status: PostStatus;
  user_permission: ProjectPermissions;
};

export type PostWithForecasts = Post<QuestionWithForecasts>;
