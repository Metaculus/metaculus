import NotFoundSection from "@/components/not_found_section";

import GlobalHeader from "./components/headers/global_header";

export default async function NotFound() {
  return (
    <>
      <GlobalHeader forceDefault />
      <NotFoundSection />
    </>
  );
}
