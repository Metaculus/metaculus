export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DataParams = {
  post_id?: number;
  question_id?: number;
  sub_question?: number;
  aggregation_methods?: string[];
  minimize?: boolean;
  user_ids?: number[];
  include_comments?: boolean;
  include_scores?: boolean;
  include_bots?: boolean;
  include_user_data?: boolean;
  include_key_factors?: boolean;
  include_geometric_means?: boolean;
  anonymized?: boolean;
};
export type WhitelistStatus = {
  is_whitelisted: boolean;
  view_deanonymized_data: boolean;
};
