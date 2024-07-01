export type CommentType = {
  id: number;
  author: any; //create author type
  on_post: number;
  parent?: number;
  created_at: Date;
  is_soft_deleted: boolean;
  text: string;
  included_forecast?: number;
};

export enum CommentPermissions {
  VIEWER = "VIEWER",
  CURATOR = "CURATOR",
  CREATOR = "CREATOR",
}
