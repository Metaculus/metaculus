import { SearchParams } from "@/types/navigation";

import ServicesQuizScreen from "../../components/services_quiz_screen";
import { isServicesQuizCategory } from "../../constants";

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function ServicesQuizPage(props: Props) {
  const sp = await props.searchParams;

  const raw =
    typeof sp.category === "string" && sp.category.length ? sp.category : null;

  const initialCategory = isServicesQuizCategory(raw) ? raw : null;

  return <ServicesQuizScreen initialCategory={initialCategory} />;
}
