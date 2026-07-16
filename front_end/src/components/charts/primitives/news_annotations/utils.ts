import { KeyFactor } from "@/types/comment";
import { getImpactDirectionFromMetadata } from "@/utils/key_factors";

import { AnnotationCluster, NewsAnnotation } from "./types";

const SECONDS_PER_DAY = 86400;
const MIN_MARKER_GAP = 22;

export function buildNewsAnnotations(
  keyFactors: KeyFactor[]
): NewsAnnotation[] {
  return keyFactors
    .filter(
      (kf): kf is KeyFactor & { news: NonNullable<KeyFactor["news"]> } =>
        !!kf.news
    )
    .map((kf) => {
      const news = kf.news;
      const timestamp = news.published_at
        ? Math.floor(new Date(news.published_at).getTime() / 1000)
        : Math.floor(new Date(kf.created_at).getTime() / 1000);

      return {
        keyFactor: kf,
        timestamp,
        title: news.title,
        source: news.source,
        imgUrl: news.img_url,
        url: news.url,
        direction: getImpactDirectionFromMetadata(news),
        strength: kf.vote?.score ?? 0,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function clusterAnnotations(
  annotations: NewsAnnotation[],
  getXPixel: (timestamp: number) => number
): AnnotationCluster[] {
  if (annotations.length === 0) return [];

  const sorted = [...annotations].sort((a, b) => a.timestamp - b.timestamp);
  const clusters: AnnotationCluster[] = [];
  const first = sorted[0];
  if (!first) return [];

  const getDay = (ts: number) => Math.floor(ts / SECONDS_PER_DAY);

  let currentCluster: AnnotationCluster = {
    timestamp: first.timestamp,
    xPixel: getXPixel(first.timestamp),
    annotations: [first],
  };
  let currentDay = getDay(first.timestamp);

  for (let i = 1; i < sorted.length; i++) {
    const annotation = sorted[i];
    if (!annotation) continue;
    const day = getDay(annotation.timestamp);
    const xPixel = getXPixel(annotation.timestamp);

    if (day === currentDay) {
      currentCluster.annotations.push(annotation);
      const totalX = currentCluster.annotations.reduce(
        (sum, a) => sum + getXPixel(a.timestamp),
        0
      );
      currentCluster.xPixel = totalX / currentCluster.annotations.length;
    } else {
      clusters.push(currentCluster);
      currentCluster = {
        timestamp: annotation.timestamp,
        xPixel,
        annotations: [annotation],
      };
      currentDay = day;
    }
  }
  clusters.push(currentCluster);

  for (let i = 1; i < clusters.length; i++) {
    const prev = clusters[i - 1];
    const curr = clusters[i];
    if (!prev || !curr) {
      continue;
    }
    if (curr.xPixel - prev.xPixel < MIN_MARKER_GAP) {
      const mid = (prev.xPixel + curr.xPixel) / 2;
      prev.xPixel = mid - MIN_MARKER_GAP / 2;
      curr.xPixel = mid + MIN_MARKER_GAP / 2;
    }
  }

  return clusters;
}
