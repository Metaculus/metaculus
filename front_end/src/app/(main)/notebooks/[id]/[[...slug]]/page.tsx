import { Metadata } from "next";
import { redirect } from "next/navigation";
import { remark } from "remark";
import strip from "strip-markdown";

import { defaultDescription } from "@/constants/metadata";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { getValidString } from "@/utils/formatters/string";
import { getPostLink } from "@/utils/navigation";

import IndividualNotebookPage from "./page_compotent";

type Props = {
  params: Promise<{ id: number; slug: string[] }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const postData = await ServerPostsApi.getPost(params.id);

  if (!postData) {
    return {};
  }

  const file = remark().use(strip).processSync(postData.notebook?.markdown);
  const parsedDescription = String(file).split("\n")[0];

  return {
    title:
      getValidString(postData.html_metadata_json?.title) ??
      getValidString(postData.short_title) ??
      postData.title,
    description:
      getValidString(postData.html_metadata_json?.description) ??
      (!!parsedDescription ? parsedDescription : defaultDescription),
  };
}

export default async function IndividualNotebook(props: Props) {
  const params = await props.params;
  const postData = await ServerPostsApi.getPost(params.id);

  // Redirect to URL with slug if accessing without slug
  if (postData && !params.slug && postData.slug) {
    redirect(getPostLink(postData));
  }

  return (
    <IndividualNotebookPage params={{ id: params.id, slug: params.slug }} />
  );
}
