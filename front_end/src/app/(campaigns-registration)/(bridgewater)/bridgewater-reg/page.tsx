import { Hero } from "./components/hero-section";

export const metadata = {
  title: "Bridgewater x Metaculus Forecasting Contest",
};

export default async function Page() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main
        className="flex flex-1 flex-col items-center justify-center p-4"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <Hero />
      </main>
    </div>
  );
}
