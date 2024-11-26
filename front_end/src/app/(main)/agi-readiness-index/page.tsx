import { redirect } from "next/navigation";

import { AGI_INDEX_ID } from "../notebooks/constants/indexes";

const slug = "agi-readiness-index";

export default async function AgiIndex() {
  redirect(`/notebooks/${AGI_INDEX_ID}/${slug}`);
}
