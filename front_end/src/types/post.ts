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

export enum ArticleType {
  Programs = "programs",
  Research = "research",
  Platform = "platform",
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
  score: number | null;
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

export type PostConditional<QT> = {
  id: number;
  condition: QuestionWithForecasts;
  condition_child: QuestionWithForecasts;
  question_yes: QT;
  question_no: QT;
};

export type Notebook = {
  id: number;
  created_at: string;
  edited_at: string;
  markdown: string;
  type: string;
  image_url: string;
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
  curation_status_updated_at: string | null;
  aim_to_close_at: string | null;
  aim_to_resolve_at: string | null;
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
  status: PostStatus;
  user_permission: ProjectPermissions;
  comment_count?: number;
  forecasts_count?: number;
};

export type PostWithNotebook = Omit<Post, "notebook"> & {
  notebook: Notebook;
};

export type PostWithForecasts = Post<QuestionWithForecasts>;
