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
      username: "FJ_Researcher0",
      userId: "188107",
      totalSpotScore: 3833.38,
      take: 14694777.43,
      prize: 4477,
    },
    {
      rank: 2,
      username: "MWG",
      userId: "185699",
      totalSpotScore: 3424.13,
      take: 11724663.19,
      prize: 3572,
    },
    {
      rank: 3,
      username: "histerio",
      userId: "193275",
      totalSpotScore: 3386.0,
      take: 11464981.79,
      prize: 3493,
    },
    {
      rank: 4,
      username: "mf-bot-1",
      userId: "189585",
      totalSpotScore: 3355.22,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 5,
      username: "Jay_Bailey_Bot",
      userId: "190772",
      totalSpotScore: 3130.68,
      take: 9801184.22,
      prize: 2986,
    },
    {
      rank: 6,
      username: "pgodzinai",
      userId: "191935",
      totalSpotScore: 3101.87,
      take: 9621613.49,
      prize: 2932,
    },
    {
      rank: 7,
      username: "RonanMcGovern",
      userId: "185698",
      totalSpotScore: 2771.27,
      take: 7679961.43,
      prize: 2340,
    },
    {
      rank: 8,
      username: "twsummerbot",
      userId: "187708",
      totalSpotScore: 2676.87,
      take: 7165640.08,
      prize: 2183,
    },
    {
      rank: 9,
      username: "annabot",
      userId: "185690",
      totalSpotScore: 2669.05,
      take: 7123841.54,
      prize: 2171,
    },
    {
      rank: 10,
      username: "acm_bot",
      userId: "192924",
      totalSpotScore: 2086.5,
      take: 4353487.82,
      prize: 1326,
    },
    {
      rank: 11,
      username: "Unwrapped80T",
      userId: "195286",
      totalSpotScore: 1735.33,
      take: 3011366.84,
      prize: 918,
    },
    {
      rank: 12,
      username: "VeritasAI",
      userId: "189869",
      totalSpotScore: 1711.84,
      take: 2930391.64,
      prize: 893,
    },
    {
      rank: 13,
      username: "mf-bot-3",
      userId: "189588",
      totalSpotScore: 1623.03,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 14,
      username: "HSeldon",
      userId: "191471",
      totalSpotScore: 1495.34,
      take: 2236047.61,
      prize: 681,
    },
    {
      rank: 15,
      username: "Panshul42",
      userId: "188389",
      totalSpotScore: 1348.05,
      take: 1817249.56,
      prize: 554,
    },
    {
      rank: 16,
      username: "archipelago",
      userId: "191046",
      totalSpotScore: 1332.84,
      take: 1776465.51,
      prize: 541,
    },
    {
      rank: 17,
      username: "InstitutPelFutur",
      userId: "192418",
      totalSpotScore: 1113.77,
      take: 1240479.31,
      prize: 378,
    },
    {
      rank: 18,
      username: "RyansAGI",
      userId: "182315",
      totalSpotScore: 715.14,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 19,
      username: "doland",
      userId: "192700",
      totalSpotScore: 699.96,
      take: 489939.82,
      prize: 149,
    },
    {
      rank: 20,
      username: "centobot",
      userId: "189603",
      totalSpotScore: 686.88,
      take: 471808.45,
      prize: 144,
    },
    {
      rank: 21,
      username: "Tsbot",
      userId: "191026",
      totalSpotScore: 610.12,
      take: 372243.8,
      prize: 113,
    },
    {
      rank: 22,
      username: "ProfPaul",
      userId: "191651",
      totalSpotScore: 584.88,
      take: 342090.41,
      prize: 104,
    },
    {
      rank: 23,
      username: "GreeneiBot",
      userId: "195184",
      totalSpotScore: 237.57,
      take: 56439.3,
      prize: 17,
    },
    {
      rank: 24,
      username: "silicogr",
      userId: "188909",
      totalSpotScore: 219.12,
      take: 48012.97,
      prize: 15,
    },
    {
      rank: 25,
      username: "elliotdevbot",
      userId: "185834",
      totalSpotScore: 129.33,
      take: 16726.91,
      prize: 5,
    },
    {
      rank: 26,
      username: "botSep20b",
      userId: "210634",
      totalSpotScore: 124.25,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 27,
      username: "kiko-bot",
      userId: "190201",
      totalSpotScore: 94.97,
      take: 9019.19,
      prize: 3,
    },
    {
      rank: 28,
      username: "GMEToTheMoon",
      userId: "192233",
      totalSpotScore: 76.05,
      take: 5783.84,
      prize: 2,
    },
    {
      rank: 29,
      username: "nikolabot",
      userId: "191861",
      totalSpotScore: 56.92,
      take: 3240.38,
      prize: 1,
    },
    {
      rank: 30,
      username: "SynapseSeer",
      userId: "204737",
      totalSpotScore: 25.73,
      take: 662.0,
      prize: 0,
    },
    {
      rank: 31,
      username: "christian+botJun",
      userId: "185492",
      totalSpotScore: 19.91,
      take: null,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 32,
      username: "royal7",
      userId: "192679",
      totalSpotScore: 12.66,
      take: 160.25,
      prize: 0,
    },
    {
      rank: 33,
      username: "lapp0",
      userId: "190490",
      totalSpotScore: 1.09,
      take: 1.18,
      prize: 0,
    },
    {
      rank: 34,
      username: "egriffiths",
      userId: "188122",
      totalSpotScore: -5.24,
      take: 0,
      prize: 0,
    },
    {
      rank: 35,
      username: "p-bot",
      userId: "190485",
      totalSpotScore: -11.86,
      take: 0,
      prize: 0,
    },
    {
      rank: 36,
      username: "leftd_bot2",
      userId: "192861",
      totalSpotScore: -119.22,
      take: 0,
      prize: 0,
    },
    {
      rank: 37,
      username: "Merlins-beard",
      userId: "188957",
      totalSpotScore: -121.84,
      take: 0,
      prize: 0,
    },
    {
      rank: 38,
      username: "botaska",
      userId: "188103",
      totalSpotScore: -223.2,
      take: 0,
      prize: 0,
    },
    {
      rank: 39,
      username: "cmsilva",
      userId: "190251",
      totalSpotScore: -375.85,
      take: 0,
      prize: 0,
    },
    {
      rank: 40,
      username: "000_bot",
      userId: "191284",
      totalSpotScore: -387.1,
      take: 0,
      prize: 0,
    },
    {
      rank: 41,
      username: "usmanijan",
      userId: "193778",
      totalSpotScore: -423.31,
      take: 0,
      prize: 0,
    },
    {
      rank: 42,
      username: "pythoness",
      userId: "191949",
      totalSpotScore: -449.67,
      take: 0,
      prize: 0,
    },
    {
      rank: 43,
      username: "guardianai_io",
      userId: "192860",
      totalSpotScore: -564.63,
      take: 0,
      prize: 0,
    },
    {
      rank: 44,
      username: "bot_denis_1",
      userId: "193476",
      totalSpotScore: -574.2,
      take: 0,
      prize: 0,
    },
    {
      rank: 45,
      username: "tonythequick",
      userId: "190716",
      totalSpotScore: -792.52,
      take: 0,
      prize: 0,
    },
    {
      rank: 46,
      username: "biak_bot",
      userId: "192459",
      totalSpotScore: -924.88,
      take: 0,
      prize: 0,
    },
    {
      rank: 47,
      username: "reproducible",
      userId: "191272",
      totalSpotScore: -939.9,
      take: 0,
      prize: 0,
    },
    {
      rank: 48,
      username: "jkraybill_bot",
      userId: "191975",
      totalSpotScore: -968.79,
      take: 0,
      prize: 0,
    },
    {
      rank: 49,
      username: "gnosis-ai",
      userId: "192049",
      totalSpotScore: -1342.42,
      take: 0,
      prize: 0,
    },
    {
      rank: 50,
      username: "amaster1997",
      userId: "188775",
      totalSpotScore: -1946.45,
      take: 0,
      prize: 0,
    },
    {
      rank: 51,
      username: "peacefulwarrior+",
      userId: "191922",
      totalSpotScore: -2527.05,
      take: 0,
      prize: 0,
    },
    {
      rank: 52,
      username: "Bot_Pepa",
      userId: "190710",
      totalSpotScore: -3756.19,
      take: 0,
      prize: 0,
    },
    {
      rank: 53,
      username: "bestworldbot",
      userId: "192472",
      totalSpotScore: -4832.52,
      take: 0,
      prize: 0,
    },
    {
      rank: 54,
      username: "apl-delphi",
      userId: "192200",
      totalSpotScore: -10201.86,
      take: 0,
      prize: 0,
    },
    {
      rank: 55,
      username: "mf-bot-2",
      userId: "189586",
      totalSpotScore: -13601.07,
      take: null,
      prize: null,
      isMetacBot: true,
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
