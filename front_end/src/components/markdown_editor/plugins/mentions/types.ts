export type MentionData = {
  userId?: number;
};

// TODO: deprecate userId as we don't convert mention item to link anymore (when in edit mode0
export type MentionItem = {
  value: string;
} & MentionData;
