// TODO: BE should probably return a field, that can be used as chart title
export function extractQuestionGroupName(title: string) {
  const match = title.match(/\((.*?)\)/);
  return match ? match[1] : title;
}
