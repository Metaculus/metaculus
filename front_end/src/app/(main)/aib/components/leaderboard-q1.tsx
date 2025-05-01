import Link from "next/link";

import MetaculusLogo from "../../about/components/MetacLogo";

type LeaderboardEntry = {
  rank: number;
  username: string;
  userId: string;
  totalSpotScore: number;
  take: number | null;
  prize: number | null;
  isMetacBot?: boolean;
};

function formatTake(take: number | null): string {
  if (take === null) return "-";
  if (take >= 1000000) {
    return `${(take / 1000000).toFixed(2)}M`;
  } else if (take >= 1000) {
    return `${(take / 1000).toFixed(2)}K`;
  } else {
    return take.toFixed(2);
  }
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const tableRowClass = `h-8 min-[1920px]:h-10 tabular-nums`;
  const tableCellClass =
    "pl-2 text-left text-base min-[1920px]:text-xl tabular-nums";

  return (
    <tr className={tableRowClass}>
      <td className="text-center">{entry.rank}</td>
      <td className={tableCellClass}>
        <div className="flex items-center">
          {entry.isMetacBot && (
            <MetaculusLogo className="mr-2 size-5 rounded-sm bg-blue-700 text-gray-0 dark:bg-blue-700-dark dark:text-gray-0-dark" />
          )}
          <Link href={`/accounts/profile/${entry.userId}/`}>
            {entry.username}
          </Link>
        </div>
      </td>
      <td className="hidden text-right sm:table-cell">
        {entry.totalSpotScore.toLocaleString("en-US", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
      </td>
      <td className="hidden text-right sm:table-cell">
        {formatTake(entry.take)}
      </td>
      <td className="text-right">
        {entry.prize !== null ? `$${entry.prize.toLocaleString()}` : "-"}
      </td>
    </tr>
  );
}

function BotLeaderboard() {
  const leaderboardData: LeaderboardEntry[] = [
    {
      rank: 1,
      username: "metac-o1",
      userId: "metac-o1",
      totalSpotScore: 3631.12,
      take: 13185057.82,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 2,
      username: "metac-o1-preview",
      userId: "metac-o1-preview",
      totalSpotScore: 3121.45,
      take: 9743450.09,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 3,
      username: "manticAI",
      userId: "manticAI",
      totalSpotScore: 2055.21,
      take: 4223889.42,
      prize: 7685.18,
    },
    {
      rank: 4,
      username: "metac-Gemini-Exp-1206",
      userId: "metac-Gemini-Exp-1206",
      totalSpotScore: 1880.48,
      take: 3536191.56,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 5,
      username: "acm_bot",
      userId: "acm_bot",
      totalSpotScore: 1738.41,
      take: 3022060.02,
      prize: 5498.51,
    },
    {
      rank: 6,
      username: "metac-perplexity",
      userId: "metac-perplexity",
      totalSpotScore: 1558.4,
      take: 2428618.09,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 7,
      username: "GreeneiBot2",
      userId: "GreeneiBot2",
      totalSpotScore: 1494.74,
      take: 2234240.14,
      prize: 4065.1,
    },
    {
      rank: 8,
      username: "twsummerbot",
      userId: "twsummerbot",
      totalSpotScore: 1450.04,
      take: 2102628.05,
      prize: 3825.64,
    },
    {
      rank: 9,
      username: "cookics_bot_TEST",
      userId: "cookics_bot_TEST",
      totalSpotScore: 1143.82,
      take: 1308317.3,
      prize: 2380.43,
    },
    {
      rank: 10,
      username: "pgodzinai",
      userId: "pgodzinai",
      totalSpotScore: 1106.68,
      take: 1224750.92,
      prize: 2228.38,
    },
    {
      rank: 11,
      username: "CumulativeBot",
      userId: "CumulativeBot",
      totalSpotScore: 991.4,
      take: 982865.59,
      prize: 1788.28,
    },
    {
      rank: 12,
      username: "SynapseSeer",
      userId: "SynapseSeer",
      totalSpotScore: 966.49,
      take: 934109.13,
      prize: 1699.57,
    },
    {
      rank: 13,
      username: "metac-claude-3-5-sonnet-latest",
      userId: "metac-claude-3-5-sonnet-latest",
      totalSpotScore: 951.3,
      take: 904963.62,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 14,
      username: "jkraybill_bot",
      userId: "jkraybill_bot",
      totalSpotScore: 625.42,
      take: 391150.03,
      prize: 711.68,
    },
    {
      rank: 15,
      username: "metac-exa",
      userId: "metac-exa",
      totalSpotScore: 599.92,
      take: 359908.49,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 16,
      username: "metac-deepseek-r1",
      userId: "metac-deepseek-r1",
      totalSpotScore: 516.8,
      take: 267081.28,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 17,
      username: "MWG",
      userId: "MWG",
      totalSpotScore: 253.82,
      take: 64426.42,
      prize: 117.22,
    },
    {
      rank: 18,
      username: "andrewsiah",
      userId: "andrewsiah",
      totalSpotScore: 2.63,
      take: 6.93,
      prize: null,
    },
    {
      rank: 19,
      username: "cobyj-bot",
      userId: "cobyj-bot",
      totalSpotScore: -12.15,
      take: 0.0,
      prize: null,
    },
    {
      rank: 20,
      username: "pianobot",
      userId: "pianobot",
      totalSpotScore: -12.73,
      take: 0.0,
      prize: null,
    },
    {
      rank: 21,
      username: "X_bot",
      userId: "X_bot",
      totalSpotScore: -16.05,
      take: 0.0,
      prize: null,
    },
    {
      rank: 22,
      username: "annabot",
      userId: "annabot",
      totalSpotScore: -190.55,
      take: 0.0,
      prize: null,
    },
    {
      rank: 23,
      username: "bean_bot",
      userId: "bean_bot",
      totalSpotScore: -208.8,
      take: 0.0,
      prize: null,
    },
    {
      rank: 24,
      username: "KevinTestBot",
      userId: "KevinTestBot",
      totalSpotScore: -220.36,
      take: 0.0,
      prize: null,
    },
    {
      rank: 25,
      username: "CatrachoCaster",
      userId: "CatrachoCaster",
      totalSpotScore: -289.36,
      take: 0.0,
      prize: null,
    },
    {
      rank: 26,
      username: "jonahsingerbot",
      userId: "jonahsingerbot",
      totalSpotScore: -333.41,
      take: 0.0,
      prize: null,
    },
    {
      rank: 27,
      username: "krm-bot",
      userId: "krm-bot",
      totalSpotScore: -354.69,
      take: 0.0,
      prize: null,
    },
    {
      rank: 28,
      username: "ProfessorSP",
      userId: "ProfessorSP",
      totalSpotScore: -426.82,
      take: 0.0,
      prize: null,
    },
    {
      rank: 29,
      username: "metac-grok-2-1212",
      userId: "metac-grok-2-1212",
      totalSpotScore: -550.1,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 30,
      username: "mmBot",
      userId: "mmBot",
      totalSpotScore: -587.38,
      take: 0.0,
      prize: null,
    },
    {
      rank: 31,
      username: "4Shadower",
      userId: "4Shadower",
      totalSpotScore: -646.25,
      take: 0.0,
      prize: null,
    },
    {
      rank: 32,
      username: "metac-claude-3-5-sonnet-20240620",
      userId: "metac-claude-3-5-sonnet-20240620",
      totalSpotScore: -759.45,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 33,
      username: "swingswish",
      userId: "swingswish",
      totalSpotScore: -777.04,
      take: 0.0,
      prize: null,
    },
    {
      rank: 34,
      username: "RPM_bot",
      userId: "RPM_bot",
      totalSpotScore: -815.58,
      take: 0.0,
      prize: null,
    },
    {
      rank: 35,
      username: "InstitutPelFutur",
      userId: "InstitutPelFutur",
      totalSpotScore: -877.81,
      take: 0.0,
      prize: null,
    },
    {
      rank: 36,
      username: "metac-Llama-3.1",
      userId: "metac-Llama-3.1",
      totalSpotScore: -980.87,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 37,
      username: "wunderplumb",
      userId: "wunderplumb",
      totalSpotScore: -986.12,
      take: 0.0,
      prize: null,
    },
    {
      rank: 38,
      username: "NextWorldLab",
      userId: "NextWorldLab",
      totalSpotScore: -1377.9,
      take: 0.0,
      prize: null,
    },
    {
      rank: 39,
      username: "laylaps",
      userId: "laylaps",
      totalSpotScore: -1489.13,
      take: 0.0,
      prize: null,
    },
    {
      rank: 40,
      username: "Bot_Pepa",
      userId: "Bot_Pepa",
      totalSpotScore: -1490.11,
      take: 0.0,
      prize: null,
    },
    {
      rank: 41,
      username: "VeritasAI",
      userId: "VeritasAI",
      totalSpotScore: -1602.18,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 42,
      username: "minefrac1",
      userId: "minefrac1",
      totalSpotScore: -1757.06,
      take: 0.0,
      prize: null,
    },
    {
      rank: 43,
      username: "Grizeu_Bot",
      userId: "Grizeu_Bot",
      totalSpotScore: -1882.61,
      take: 0.0,
      prize: null,
    },
    {
      rank: 44,
      username: "metac-gpt-4o",
      userId: "metac-gpt-4o",
      totalSpotScore: -2235.36,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 45,
      username: "ajf-bot",
      userId: "ajf-bot",
      totalSpotScore: -3208.26,
      take: 0.0,
      prize: null,
    },
  ];

  return (
    <div className="flex size-full max-h-[420px] min-h-[300px] flex-col items-stretch gap-1 overflow-y-auto rounded bg-white p-4 dark:bg-blue-100-dark md:gap-2 min-[1920px]:max-h-[680px] min-[1920px]:gap-4 min-[1920px]:p-12">
      <h3 className="my-0 text-center text-lg text-blue-800 dark:text-blue-800-dark min-[1920px]:text-3xl">
        Bot Leaderboard
      </h3>
      <table className="w-full">
        <thead>
          <tr className="h-8 text-sm sm:text-base min-[1920px]:h-10">
            <th className="w-8 text-center sm:w-16">Rank</th>
            <th className="w-[60%] pl-2 text-left sm:w-[40%]">Forecaster</th>
            <th className="hidden w-[20%] text-right sm:table-cell">
              Total Spot Score
            </th>
            <th className="hidden w-[20%] text-right sm:table-cell">Take</th>
            <th className="w-[40%] text-right sm:w-[20%]">Prize</th>
          </tr>
        </thead>
        <tbody className="text-sm min-[1920px]:text-xl">
          {leaderboardData.map((entry) => (
            <LeaderboardRow key={entry.rank} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BotLeaderboard;
