import { getTranslations } from "next-intl/server";

import HeadingBlock from "./components/heading_block";
import PartnersCarousel from "./components/partners_carousel";
// TODO: adjust metadata
export const metadata = {
  title: "Services Metaculus",
  description:
    "Metaculus is an online forecasting platform and aggregation engine working to improve human reasoning and coordination on topics of global importance.",
};

export default async function ServicesPage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:pt-[52px] lg:pt-[72px] xl:pt-[132px]">
      <HeadingBlock />
      <PartnersCarousel />
    </main>
  );
}
