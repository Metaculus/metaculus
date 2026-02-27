import { Metadata } from "next";

import { defaultDescription } from "@/constants/metadata";
import { PostWithForecasts } from "@/types/post";
import { SearchParams } from "@/types/navigation";
import { getValidString } from "@/utils/formatters/string";
import { getPublicSettings } from "@/utils/public_settings.server";
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
      getValidString(postData.html_metadata_json?.title) ??
      getValidString(postData.short_title) ??
      questionTitle,
    description:
      getValidString(postData.html_metadata_json?.description) ??
      defaultDescription,
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

function buildNewsArticleJsonLd(postData: PostWithForecasts, postId: number) {
  const { PUBLIC_APP_URL } = getPublicSettings();
  const questionTitle = getPostTitle(postData);
  const headline =
    getValidString(postData.html_metadata_json?.title) ??
    getValidString(postData.short_title) ??
    questionTitle;
  const description =
    getValidString(postData.html_metadata_json?.description) ??
    defaultDescription;
  const imageUrl =
    postData.html_metadata_json?.image_url ??
    `${PUBLIC_APP_URL}/questions/${postId}/image-preview/`;
  const pageUrl = `${PUBLIC_APP_URL}/questions/${postId}/${postData.slug}/`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline,
    description,
    image: imageUrl,
    datePublished: postData.published_at,
    dateModified: postData.updated_at,
    author: {
      "@type": "Person",
      name: postData.author_username,
      url: `${PUBLIC_APP_URL}/accounts/profile/${postData.author_id}/`,
    },
    publisher: {
      "@type": "Organization",
      name: "Metaculus",
      url: PUBLIC_APP_URL,
      logo: {
        "@type": "ImageObject",
        url: `${PUBLIC_APP_URL}/images/metaculus_logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };
}

export default async function IndividualQuestionRoute(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const postData = await cachedGetPost(params.id);

  const jsonLd = postData
    ? buildNewsArticleJsonLd(postData, params.id)
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <IndividualQuestionPage params={params} searchParams={searchParams} />
    </>
  );
}
