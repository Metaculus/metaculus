import AwaitedGlobalLeaderboard from "../components/globalLeaderboard";

//  @TODO: How to not hardcode the ids here -- or maybe we just should (?)
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
          <AwaitedGlobalLeaderboard
            startTime={"2016-01-01"}
            endTime={"2017-01-01"}
            leaderboardType={"peer_global_legacy"}
          />
          <AwaitedGlobalLeaderboard
            startTime={"2016-01-01"}
            endTime={"2017-01-01"}
            leaderboardType={"baseline_global"}
          />
        </div>
      </div>
    </main>
  );
}
