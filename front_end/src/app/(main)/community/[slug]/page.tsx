import { SearchParams } from "@/types/navigation";

import CommunityHeader from "../../components/headers/community_header";

type Props = {
  params: { slug: string[] };
  searchParams: SearchParams;
};

export default async function IndividualCommunity({
  params,
  searchParams,
}: Props) {
  return (
    <>
      <CommunityHeader />
      <main className="mx-auto flex w-full max-w-max flex-col scroll-smooth py-4">
        <h1>Individual community page template</h1>
        <p>Community slug: {params.slug}</p>
      </main>
    </>
  );
}
