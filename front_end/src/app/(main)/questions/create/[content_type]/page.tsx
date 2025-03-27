import { isNil } from "lodash";
import { notFound } from "next/navigation";
import invariant from "ts-invariant";

import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import GroupForm from "@/app/(main)/questions/components/group_form";
import QuestionForm from "@/app/(main)/questions/components/question_form";
import RepostForm from "@/app/(main)/questions/components/repost";
import { extractMode } from "@/app/(main)/questions/create/helpers";
import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";

import ConditionalForm from "../../components/conditional_form";
import NotebookForm from "../../components/notebook_form";

type Props = {
  params: Promise<{ content_type: string }>;
  searchParams: Promise<SearchParams>;
};

const numberOrUndefined = (value: string | string[] | undefined) =>
  isNil(value) ? undefined : Number(value);

export default async function QuestionCreator(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { content_type } = params;

  invariant(content_type, "Question type is required");
  const post_id = numberOrUndefined(searchParams["post_id"]);
  const post = isNil(post_id)
    ? undefined
    : await PostsApi.getPost(Number(post_id));

  // Edition mode
  const mode = extractMode(searchParams, post);

  const siteMain = await ProjectsApi.getSiteMain();
  const allCategories = await ProjectsApi.getCategories();

  // Fetching tournaments
  const tournament_id = numberOrUndefined(searchParams["tournament_id"]);
  const tournaments = await ProjectsApi.getTournaments();
  // If the tournament is unlisted, it won't be retrieved via the getTournaments call.
  // In that case, we need to fetch it separately and append it to the tournaments list.
  if (tournament_id && !tournaments.some((obj) => obj.id === tournament_id)) {
    const tournament = await ProjectsApi.getTournament(tournament_id);

    if (tournament) {
      tournaments.push(tournament);
    }
  }

  // Fetching communities
  const community_id = numberOrUndefined(searchParams["community_id"]);
  const communitiesResponse = community_id
    ? await ProjectsApi.getCommunities({ ids: [community_id] })
    : undefined;
  const community = communitiesResponse
    ? communitiesResponse.results[0]
    : undefined;

  const componentProps = {
    post,
    mode,
    tournament_id,
    community_id,
    allCategories,
    tournaments,
    siteMain,
  };
  let component = undefined;

  if (content_type === "question") {
    const question_type: string = post
      ? (post.question?.type as string)
      : (searchParams["type"] as string);

    invariant(question_type, "Type is required");

    component = (
      <QuestionForm questionType={question_type} {...componentProps} />
    );
  }

  if (content_type === "group") {
    const subtype = post
      ? post.group_of_questions?.questions[0]?.type
      : (searchParams["subtype"] as string);

    invariant(subtype, "Subtype is required");

    component = <GroupForm subtype={subtype} {...componentProps} />;
  }

  if (content_type === "conditional") {
    let condition = null;
    let conditionChild = null;
    if (post) {
      condition = await PostsApi.getQuestion(
        Number(post?.conditional?.condition.id)
      );
      conditionChild = await PostsApi.getQuestion(
        Number(post?.conditional?.condition_child.id)
      );
    }

    component = (
      <ConditionalForm
        conditionParentInit={condition}
        conditionChildInit={conditionChild}
        {...componentProps}
      />
    );
  }

  if (content_type === "notebook") {
    const news_category_id = numberOrUndefined(
      searchParams["news_category_id"]
    );

    component = (
      <NotebookForm news_category_id={news_category_id} {...componentProps} />
    );
  }

  if (content_type === "repost") {
    invariant(community, "Community is required!");

    component = <RepostForm community={community} />;
  }

  if (!component) {
    return notFound();
  }

  return (
    <>
      {community ? <CommunityHeader community={community} /> : <Header />}
      {component}
    </>
  );
}
