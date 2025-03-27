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
      <td className="text-right">
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
      username: "pgodzinai",
      userId: "191935",
      totalSpotScore: 4020.351,
      take: 16163220.99,
      prize: 9658,
    },
    {
      rank: 2,
      username: "MWG",
      userId: "185699",
      totalSpotScore: 2737.287,
      take: 7492742.699,
      prize: 4477,
    },
    {
      rank: 3,
      username: "GreeneiBot2",
      userId: "218666",
      totalSpotScore: 2564.548,
      take: 6577087.967,
      prize: 3930,
    },
    {
      rank: 4,
      username: "manticAI",
      userId: "191026",
      totalSpotScore: 2388.803,
      take: 5706380.789,
      prize: 3410,
    },
    {
      rank: 5,
      username: "histerio",
      userId: "193275",
      totalSpotScore: 2354.163,
      take: 5542081.968,
      prize: 3312,
    },
    {
      rank: 6,
      username: "mf-bot-4",
      userId: "208405",
      totalSpotScore: 2197.77,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 7,
      username: "annabot",
      userId: "185690",
      totalSpotScore: 1693.428,
      take: 2867697.448,
      prize: 1714,
    },
    {
      rank: 8,
      username: "Cassie",
      userId: "188107",
      totalSpotScore: 1598.554,
      take: 2555376.04,
      prize: 1527,
    },
    {
      rank: 9,
      username: "twsummerbot",
      userId: "187708",
      totalSpotScore: 1267.008,
      take: 1605308.661,
      prize: 959,
    },
    {
      rank: 10,
      username: "mf-bot-5",
      userId: "221727",
      totalSpotScore: 1009.427,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 11,
      username: "VeritasAI",
      userId: "189869",
      totalSpotScore: 887.362,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 12,
      username: "gnosis-ai",
      userId: "192049",
      totalSpotScore: 838.039,
      take: 702309.879,
      prize: 420,
    },
    {
      rank: 13,
      username: "RyansAGI",
      userId: "182315",
      totalSpotScore: 697.119,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 14,
      username: "Jay_Bailey_Bot",
      userId: "190772",
      totalSpotScore: 614.92,
      take: 378126.289,
      prize: 226,
    },
    {
      rank: 15,
      username: "Unwrapped80T",
      userId: "195286",
      totalSpotScore: 499.233,
      take: 249233.989,
      prize: 149,
    },
    {
      rank: 16,
      username: "tombot37",
      userId: "218269",
      totalSpotScore: 483.735,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 17,
      username: "mf-bot-1",
      userId: "189585",
      totalSpotScore: 428.07,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 18,
      username: "estr.ai",
      userId: "215725",
      totalSpotScore: 398.714,
      take: 158972.929,
      prize: 95,
    },
    {
      rank: 19,
      username: "acm_bot",
      userId: "192924",
      totalSpotScore: 264.411,
      take: 69913.369,
      prize: 42,
    },
    {
      rank: 20,
      username: "HunchexBot",
      userId: "219991",
      totalSpotScore: 238.542,
      take: 56902.366,
      prize: 34,
    },
    {
      rank: 21,
      username: "karamazov",
      userId: "219459",
      totalSpotScore: 226.536,
      take: 51318.391,
      prize: 31,
    },
    {
      rank: 22,
      username: "silicoqr",
      userId: "188909",
      totalSpotScore: 168.77,
      take: 28483.15,
      prize: 17,
    },
    {
      rank: 23,
      username: "tombot61",
      userId: "216863",
      totalSpotScore: 63.727,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 24,
      username: "hlb-bot",
      userId: "226082",
      totalSpotScore: 27.162,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 25,
      username: "Panshul42",
      userId: "188389",
      totalSpotScore: -0.511,
      take: 0,
      prize: 0,
    },
    {
      rank: 26,
      username: "jkraybill_bot",
      userId: "191975",
      totalSpotScore: -134.627,
      take: 0,
      prize: 0,
    },
    {
      rank: 27,
      username: "rrmBot",
      userId: "220077",
      totalSpotScore: -141.009,
      take: 0,
      prize: 0,
    },
    {
      rank: 28,
      username: "lookahead",
      userId: "222046",
      totalSpotScore: -218.543,
      take: 0,
      prize: 0,
    },
    {
      rank: 29,
      username: "SaraBase",
      userId: "219886",
      totalSpotScore: -252.436,
      take: 0,
      prize: 0,
    },
    {
      rank: 30,
      username: "Bot_Pepa",
      userId: "190710",
      totalSpotScore: -267.34,
      take: 0,
      prize: 0,
    },
    {
      rank: 31,
      username: "ProfessorSP",
      userId: "227188",
      totalSpotScore: -388.045,
      take: 0,
      prize: 0,
    },
    {
      rank: 32,
      username: "lostandfound",
      userId: "219659",
      totalSpotScore: -557.161,
      take: 0,
      prize: 0,
    },
    {
      rank: 33,
      username: "predictomatic",
      userId: "222142",
      totalSpotScore: -620.195,
      take: 0,
      prize: 0,
    },
    {
      rank: 34,
      username: "archipelago",
      userId: "191046",
      totalSpotScore: -696.2,
      take: 0,
      prize: 0,
    },
    {
      rank: 35,
      username: "Grizeu_Bot",
      userId: "222631",
      totalSpotScore: -723.739,
      take: 0,
      prize: 0,
    },
    {
      rank: 36,
      username: "HSeldon",
      userId: "191471",
      totalSpotScore: -813.598,
      take: 0,
      prize: 0,
    },
    {
      rank: 37,
      username: "bestworldbot",
      userId: "192472",
      totalSpotScore: -872.116,
      take: 0,
      prize: 0,
    },
    {
      rank: 38,
      username: "SynapseSeer",
      userId: "204737",
      totalSpotScore: -1619.921,
      take: 0,
      prize: 0,
    },
    {
      rank: 39,
      username: "000_bot",
      userId: "191284",
      totalSpotScore: -1737.793,
      take: 0,
      prize: 0,
    },
    {
      rank: 40,
      username: "SeidrBot",
      userId: "218945",
      totalSpotScore: -2089.815,
      take: 0,
      prize: 0,
    },
    {
      rank: 41,
      username: "RonanMcGovern",
      userId: "185698",
      totalSpotScore: -2842.212,
      take: 0,
      prize: 0,
    },
    {
      rank: 42,
      username: "mf-bot-3",
      userId: "189588",
      totalSpotScore: -3190.61,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 43,
      username: "InstitutPelFutur",
      userId: "192418",
      totalSpotScore: -3298.503,
      take: 0,
      prize: 0,
    },
    {
      rank: 44,
      username: "biak_bot",
      userId: "192459",
      totalSpotScore: -7203.342,
      take: 0,
      prize: 0,
    },
  ];

  return (
    <div className="flex size-full max-h-[420px] min-h-[300px] flex-col items-stretch gap-1 overflow-y-auto rounded bg-white p-4 dark:bg-blue-100-dark md:gap-2 min-[1920px]:max-h-[680px] min-[1920px]:gap-4 min-[1920px]:p-12">
      <h3 className="my-0 text-center text-lg text-blue-800 dark:text-blue-800-dark min-[1920px]:text-3xl">
        Bot Leaderboard
      </h3>
      <table className="w-full">
        <thead>
          <tr className="h-8 min-[1920px]:h-10">
            <th className="text-center">Rank</th>
            <th className="pl-2 text-left">Forecaster</th>
            <th className="text-right">Total Spot Score</th>
            <th className="hidden text-right sm:table-cell">Take</th>
            <th className="text-right">Prize</th>
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
