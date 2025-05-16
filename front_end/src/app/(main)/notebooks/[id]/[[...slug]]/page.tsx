import { Metadata } from "next";
import { remark } from "remark";
import strip from "strip-markdown";

import { defaultDescription } from "@/constants/metadata";
import ServerPostsApi from "@/services/api/posts/posts.server";

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
      postData.html_metadata_json?.title ??
      postData.short_title ??
      postData.title,
    description:
      postData.html_metadata_json?.description ??
      (!!parsedDescription ? parsedDescription : defaultDescription),
  };
}

export default async function IndividualNotebook(props: Props) {
  const params = await props.params;
  return (
    <IndividualNotebookPage params={{ id: params.id, slug: params.slug }} />
  );
}
