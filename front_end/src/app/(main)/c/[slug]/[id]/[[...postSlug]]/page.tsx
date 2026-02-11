import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { remark } from "remark";
import strip from "strip-markdown";

import IndividualNotebookPage from "@/app/(main)/notebooks/[id]/[[...slug]]/page_compotent";
import IndividualQuestionPage from "@/app/(main)/questions/[id]/[[...slug]]/page_component";
import { defaultDescription } from "@/constants/metadata";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { SearchParams } from "@/types/navigation";
import { TournamentType } from "@/types/projects";
import { getPostTitle } from "@/utils/questions/helpers";

type Props = {
  params: Promise<{ id: number; slug: string[]; postSlug: string[] }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const postData = await ServerPostsApi.getPost(params.id);

  if (!postData) {
    return {};
  }

  if (postData.notebook) {
    const file = remark().use(strip).processSync(postData.notebook.markdown);
    const parsedDescription = String(file).split("\n")[0];

    return {
      title: postData.title,
      description: !!parsedDescription ? parsedDescription : defaultDescription,
    };
  }
  const questionTitle = getPostTitle(postData);
  return {
    title: questionTitle,
    description: null,
    openGraph: {
      type: "article",
      images: {
        url: `/questions/${params.id}/image-preview/`,
        width: 1200,
        height: 630,
        alt: "community predictions",
      },
    },
    twitter: {
      site: "@metaculus",
      card: "summary_large_image",
      images: {
        url: `/questions/${params.id}/image-preview/`,
        width: 1200,
        height: 630,
        alt: "community predictions",
      },
    },
  };
}

async function CommunityPost(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const postData = await ServerPostsApi.getPost(params.id);

  if (!postData) {
    return notFound();
  }

  const defaultProject = postData.projects?.default_project;
  const isCommunityPost = defaultProject?.type === TournamentType.Community;
  if (!isCommunityPost) {
    // question page also handle redirect to regular notebooks path
    return redirect(`/questions/${postData.id}`);
  }

  if (postData.notebook) {
    return (
      <IndividualNotebookPage
        params={{ id: params.id, slug: params.postSlug }}
      />
    );
  }

  return (
    <IndividualQuestionPage
      params={{ id: params.id, slug: params.postSlug }}
      searchParams={searchParams}
    />
  );
}

export default CommunityPost;
