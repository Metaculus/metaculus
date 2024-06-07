export type CommentType = {
  id: number;
  author_id: number;
  parent_id?: number;
  created_at: Date;
  edited_at?: Date;
  is_soft_deleted: boolean;
  text: string;
  type: string;
};
