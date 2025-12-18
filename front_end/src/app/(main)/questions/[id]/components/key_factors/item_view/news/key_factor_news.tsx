import KeyFactorStrengthItem from "../key_factor_strength_item";
import KeyFactorNewsItem from "./key_factor_news_item";

const KeyFactorNews: React.FC<
  Omit<Parameters<typeof KeyFactorStrengthItem>[0], "label" | "impactMetadata">
> = (props) => {
  if (!props.keyFactor.news) return null;
  const { news } = props.keyFactor;
  return (
    <KeyFactorStrengthItem
      {...props}
      label="news"
      impactMetadata={{
        impact_direction: news.impact_direction,
        certainty: news.certainty,
      }}
    >
      <KeyFactorNewsItem
        faviconUrl={news.img_url ?? null}
        source={news.source}
        title={news.title}
        createdAt={news.published_at ?? ""}
        isCompact={props.isCompact}
        isConsumer={props.mode === "consumer"}
        url={news.url}
      />
    </KeyFactorStrengthItem>
  );
};

export default KeyFactorNews;
