import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { remark } from "remark";
import strip from "strip-markdown";

import NotebookPage from "@/app/(main)/notebooks/[id]/[[...slug]]/page";
import QuestionPage from "@/app/(main)/questions/[id]/[[...slug]]/page";
import { defaultDescription } from "@/constants/metadata";
import PostsApi from "@/services/posts";
import { SearchParams } from "@/types/navigation";
import { TournamentType } from "@/types/projects";
import { getQuestionTitle } from "@/utils/questions";

type Props = {
  params: { id: number; slug: string[]; postSlug: string[] };
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const postData = await PostsApi.getPost(params.id);

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
  const questionTitle = getQuestionTitle(postData);
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

async function CommunityPost({ params, searchParams }: Props) {
  const postData = await PostsApi.getPost(params.id);

  if (!postData) {
    return notFound();
  }

  const defaultProject = postData.projects.default_project;
  const isCommunityPost = defaultProject.type === TournamentType.Community;
  if (!isCommunityPost) {
    // question page also handle redirect to regular notebooks path
    return redirect(`/questions/${postData.id}`);
  }

  if (postData.notebook) {
    return <NotebookPage params={{ id: params.id, slug: params.postSlug }} />;
  }

  return (
    <QuestionPage
      params={{ id: params.id, slug: params.postSlug }}
      searchParams={searchParams}
    />
  );
}

export default CommunityPost;
