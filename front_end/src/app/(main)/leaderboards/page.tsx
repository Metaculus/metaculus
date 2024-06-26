import Leaderboard from "@/components/leaderboard";

export default async function GlobalLeaderboards() {
  return (
    <main className="mx-auto mb-auto w-full max-w-3xl px-2 pb-4">
      <h1 className="mb-6 mt-12 text-center text-5xl font-bold text-blue-800 dark:text-blue-800-dark">
        Global{" "}
        <span className="text-blue-700 dark:text-blue-700-dark">
          Leaderboards
        </span>
      </h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          2016 Peer
          <Leaderboard projectId={31844} />
        </div>
        <div>
          2017 Peer
          <Leaderboard projectId={31850} />
        </div>
      </div>
    </main>
  );
}
