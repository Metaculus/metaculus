const TWITTER_REGEX =
  /https?:\/\/(?:twitter|vxtwitter|x)\.com\/(?:#!\/)?\w+\/status(?:es)?\/(\d+)/g;

export const transformTwitterLinks = (markdown: string): string => {
  const matches = markdown.match(TWITTER_REGEX);

  if (!matches) {
    return markdown;
  }

  const uniqueTweetIds = new Set<string>();
  matches.forEach((match) => {
    const tweetIdMatch = match.match(/(\d+)$/);
    if (tweetIdMatch && tweetIdMatch[1]) {
      uniqueTweetIds.add(tweetIdMatch[1]);
    }
  });

  const tweetComponents = Array.from(uniqueTweetIds)
    .map((id) => `<Tweet id="${id}" />`)
    .join("\n");
  const tweetsWrapper = `<div class="tweets-wrapper">${tweetComponents}</div>`;
  return `${markdown}\n\n${tweetsWrapper}`;
};
