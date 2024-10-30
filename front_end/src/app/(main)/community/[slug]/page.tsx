import { SearchParams } from "@/types/navigation";

type Props = {
  params: { slug: string[] };
  searchParams: SearchParams;
};

export default async function IndividualCommunity({
  params,
  searchParams,
}: Props) {
  return (
    <div>
      <h1>Individual community page template</h1>
      <p>Community slug: {params.slug}</p>
    </div>
  );
}
