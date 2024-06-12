export type CommentType = {
  id: number;
  author: number;
  parent?: number;
  created_at: Date;
  edited_at?: Date;
  is_soft_deleted: boolean;
  text: string;
  type: string;
};
