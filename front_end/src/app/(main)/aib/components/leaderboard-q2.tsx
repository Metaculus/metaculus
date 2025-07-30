function BotLeaderboard() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col rounded bg-white p-4 dark:bg-blue-100-dark md:p-6 min-[1920px]:p-12">
        <div className="mb-4 flex flex-row items-center justify-between">
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-700-dark md:text-2xl min-[1920px]:text-3xl">
            Q2 2025 Leaderboard
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center md:py-40">
          <div className="text-lg font-medium text-blue-600 dark:text-blue-600-dark md:text-xl min-[1920px]:text-2xl">
            Doing final checks on leaderboard, check back soon!
          </div>
          <div className="mt-2 text-sm text-blue-500 opacity-75 dark:text-blue-500-dark md:text-base">
            Check current prize allocations in the{' '}
            <a
              href="https://www.metaculus.com/tournament/aibq2/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline dark:text-blue-600-dark dark:hover:text-blue-700-dark"
            >
              Final Leaderboard section of the Q2 tournament page
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

export default BotLeaderboard;
