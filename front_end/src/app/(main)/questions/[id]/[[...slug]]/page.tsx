import { Metadata } from "next";

import { SearchParams } from "@/types/navigation";
import { getPostTitle } from "@/utils/questions/helpers";

import IndividualQuestionPage from "./page_component";
import { cachedGetPost } from "./utils/get_post";

type Props = {
  params: Promise<{ id: number; slug: string[] }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const postData = await cachedGetPost(params.id);

  if (!postData) {
    return {};
  }

  const questionTitle = getPostTitle(postData);
  return {
    title:
      postData.html_metadata_json?.title ??
      postData.short_title ??
      questionTitle,
    description: postData.html_metadata_json?.description,
    openGraph: {
      type: "article",
      images: {
        url:
          postData.html_metadata_json?.image_url ??
          `/questions/${params.id}/image-preview/`,
        width: 1200,
        height: 630,
        alt: "community predictions",
      },
    },
    twitter: {
      site: "@metaculus",
      card: "summary_large_image",
      images: {
        url:
          postData.html_metadata_json?.image_url ??
          `/questions/${params.id}/image-preview/`,
        width: 1200,
        height: 630,
        alt: "community predictions",
      },
    },
  };
}

export default async function IndividualQuestionRoute(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  return <IndividualQuestionPage params={params} searchParams={searchParams} />;
}
