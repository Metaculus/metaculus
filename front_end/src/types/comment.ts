export type CommentType = {
  id: number;
  author: any; //create author type
  parent?: number;
  created_at: Date;
  edited_at?: Date;
  is_soft_deleted: boolean;
  text: string;
  type: string;
};
