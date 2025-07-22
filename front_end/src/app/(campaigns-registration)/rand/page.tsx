import GlobalHeader from "@/app/(main)/components/headers/global_header";

import { Hero } from "./components/hero-section";

export const metadata = {
  title: "RAND x Metaculus National Forecasting Tournament - $10,000 in Prizes",
  description:
    "Join the national forecasting tournament for university students. Predict the future, inform public policy, and compete for $10,000 in prizes. Partnership between Metaculus and RAND Corporation.",
};

export default async function Page() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GlobalHeader />
      <main
        className="flex flex-1 flex-col items-center justify-center p-4"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <Hero />
      </main>
    </div>
  );
}
