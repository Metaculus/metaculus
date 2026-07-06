import Link from "next/link";

type LeaderboardProps = {
  title: string;
  data: string[][];
  headers: string[];
};

function ResultsLeaderboard({ title, data, headers }: LeaderboardProps) {
  const getColumnIndex = (header: string) => {
    return headers.findIndex((h) => h.toLowerCase() === header.toLowerCase());
  };

  const rankColumnIndex = getColumnIndex("Rank");
  const usernameColumnIndex = getColumnIndex("Forecaster");
  const totalScoreColumnIndex = getColumnIndex("Total Score");
  const userIDColumn = getColumnIndex("User ID");
  const prizeColumnIndex = getColumnIndex("Prize");

  // Get only the first 10 rows
  const top10Rows = data.slice(1, 11);

  return (
    <div className="flex size-full max-h-[420px] min-h-[300px] flex-col items-stretch gap-1 overflow-y-auto rounded bg-white p-4 dark:bg-blue-100-dark md:gap-2 min-[1920px]:max-h-[800px] min-[1920px]:gap-4 min-[1920px]:p-12">
      <h3 className="my-0 text-center text-lg text-blue-800 dark:text-blue-800-dark min-[1920px]:text-3xl">
        {title}
      </h3>
      <table className="size-full">
        <thead>
          <tr className="h-8 text-gray-500 min-[1920px]:h-10">
            <th className="text-center text-xs md:text-sm ">Rank</th>
            <th className="pl-2 text-left text-xs md:text-sm ">Forecaster</th>
            <th className="hidden pr-4 text-right text-xs md:table-cell md:text-sm ">
              Total Score
            </th>
            <th className="text-right text-xs md:text-sm ">Prize</th>
          </tr>
        </thead>
        <tbody className="text-sm min-[1920px]:text-xl">
          {top10Rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="h-8 min-[1920px]:h-10">
              <td className="text-center">{row[rankColumnIndex]}</td>
              <td className="pl-2 text-left text-base min-[1920px]:text-xl">
                <Link href={`/accounts/profile/${row[userIDColumn]}`}>
                  {row[usernameColumnIndex]}
                </Link>
              </td>
              <td className="hidden pr-4 text-right text-sm tabular-nums opacity-75 md:table-cell lg:text-base">
                {row[totalScoreColumnIndex]}
              </td>
              <td className="text-right text-sm font-bold tabular-nums text-olive-800 dark:text-olive-300 lg:text-base">
                {row[prizeColumnIndex]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResultsLeaderboard;
