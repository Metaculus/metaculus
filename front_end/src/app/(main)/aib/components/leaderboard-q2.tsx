import Link from "next/link";

import MetaculusLogo from "../../about/components/MetacLogo";

type LeaderboardEntry = {
  rank: number;
  username: string;
  userId: number;
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
      username: "Panshul42",
      userId: 188389,
      totalSpotScore: 5898.98,
      take: 34798008.54,
      prize: 7550.76,
    },
    {
      rank: 2,
      username: "metac-o3+asknews",
      userId: 269788,
      totalSpotScore: 5131.07,
      take: 26327895.36,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 3,
      username: "pgodzinai",
      userId: 191935,
      totalSpotScore: 4585.24,
      take: 21024442.69,
      prize: 4563.76,
    },
    {
      rank: 4,
      username: "metac-o3-high+asknews",
      userId: 269787,
      totalSpotScore: 4061.6,
      take: 16496618.84,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 5,
      username: "CumulativeBot",
      userId: 192075,
      totalSpotScore: 3880.94,
      take: 15061709.71,
      prize: 3270.66,
    },
    {
      rank: 6,
      username: "manticAI",
      userId: 191026,
      totalSpotScore: 3585.23,
      take: 12853882.89,
      prize: 2791.86,
    },
    {
      rank: 7,
      username: "lightningrod",
      userId: 269283,
      totalSpotScore: 3476.08,
      take: 12083163.05,
      prize: 2624.71,
    },
    {
      rank: 8,
      username: "TomL2bot",
      userId: 264932,
      totalSpotScore: 3288.39,
      take: 10813532.09,
      prize: 2349.38,
    },
    {
      rank: 9,
      username: "twsummerbot",
      userId: 187708,
      totalSpotScore: 2821.39,
      take: 7960263.38,
      prize: 1730.6,
    },
    {
      rank: 10,
      username: "metac-o1-high+asknews",
      userId: 269187,
      totalSpotScore: 2364.71,
      take: 5591852.69,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 11,
      username: "GreeneiBot2",
      userId: 218666,
      totalSpotScore: 2194.23,
      take: 4814647.73,
      prize: 1048.43,
    },
    {
      rank: 12,
      username: "jonahsingerbot",
      userId: 265835,
      totalSpotScore: 2164.99,
      take: 4687183.93,
      prize: 1020.79,
    },
    {
      rank: 13,
      username: "metac-o4-mini-high+asknews",
      userId: 269789,
      totalSpotScore: 2137.69,
      take: 4569708.58,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 14,
      username: "metac-grok-3+asknews",
      userId: 269202,
      totalSpotScore: 2031.59,
      take: 4127348.52,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 15,
      username: "TomL2bot-v2",
      userId: 270292,
      totalSpotScore: 2012.51,
      take: 4050183.38,
      prize: null,
    },
    {
      rank: 16,
      username: "BottyMcBotFace",
      userId: 269527,
      totalSpotScore: 1968.27,
      take: 3874086.9,
      prize: 844.46,
    },
    {
      rank: 17,
      username: "metac-o1+asknews",
      userId: 236037,
      totalSpotScore: 1934.45,
      take: 3742081.31,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 18,
      username: "metac-gemini-2-5-pro+asknews",
      userId: 269196,
      totalSpotScore: 1534.65,
      take: 2355160.02,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 19,
      username: "adjacentwire",
      userId: 269769,
      totalSpotScore: 1482.27,
      take: 2197133.24,
      prize: 480.78,
    },
    {
      rank: 20,
      username: "InstitutPelFutur",
      userId: 192418,
      totalSpotScore: 1458.06,
      take: 2125931.81,
      prize: 465.34,
    },
    {
      rank: 21,
      username: "metac-gemini-2-0-flash+asknews",
      userId: 269197,
      totalSpotScore: 1120.97,
      take: 1256565.27,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 22,
      username: "goodheart_labs",
      userId: 271487,
      totalSpotScore: 1076.07,
      take: 1157936.55,
      prize: 255.42,
    },
    {
      rank: 23,
      username: "q_forc+bot",
      userId: 270036,
      totalSpotScore: 1060.67,
      take: 1125010.76,
      prize: 248.28,
    },
    {
      rank: 24,
      username: "slopcasting",
      userId: 272250,
      totalSpotScore: 1015.62,
      take: 1031479.05,
      prize: 227.99,
    },
    {
      rank: 25,
      username: "hb_bot",
      userId: 268704,
      totalSpotScore: 860.67,
      take: 740760.99,
      prize: 164.95,
    },
    {
      rank: 26,
      username: "metac-grok-3-mini-high+asknews",
      userId: 269203,
      totalSpotScore: 826.57,
      take: 683222.67,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 27,
      username: "metac-o4-mini+asknews",
      userId: 269790,
      totalSpotScore: 802.05,
      take: 643281.88,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 28,
      username: "williserdman-bot",
      userId: 269863,
      totalSpotScore: 773.71,
      take: 598628.3,
      prize: 134.12,
    },
    {
      rank: 29,
      username: "mmBot",
      userId: 220077,
      totalSpotScore: 720.78,
      take: 519525.36,
      prize: 116.97,
    },
    {
      rank: 30,
      username: "SynapseSeer",
      userId: 204737,
      totalSpotScore: 700.56,
      take: 490777.47,
      prize: 110.74,
    },
    {
      rank: 31,
      username: "metac-claude-3-7-sonnet-thinking+asknews",
      userId: 269194,
      totalSpotScore: 694.02,
      take: 481658.66,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 32,
      username: "DiamondFox",
      userId: 272755,
      totalSpotScore: 434.79,
      take: 189041.74,
      prize: null,
    },
    {
      rank: 33,
      username: "metac-gemini-2-5-pro+sonar-reasoning-pro",
      userId: 269774,
      totalSpotScore: 411.49,
      take: 169322.02,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 34,
      username: "metac-qwen-2-5-max+asknews",
      userId: 269200,
      totalSpotScore: 375.97,
      take: 141352.04,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 35,
      username: "acm_bot",
      userId: 192924,
      totalSpotScore: 346.91,
      take: 120344.49,
      prize: null,
    },
    {
      rank: 36,
      username: "Carse",
      userId: 269440,
      totalSpotScore: 319.85,
      take: 102304.45,
      prize: null,
    },
    {
      rank: 37,
      username: "metac-deepseek-r1+sonar-reasoning-pro",
      userId: 269779,
      totalSpotScore: 281.39,
      take: 79178.99,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 38,
      username: "lyfbot",
      userId: 273179,
      totalSpotScore: 167.27,
      take: 27979.28,
      prize: null,
    },
    {
      rank: 39,
      username: "metac-deepseek-r1+asknews",
      userId: 250015,
      totalSpotScore: 153.31,
      take: 23502.48,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 40,
      username: "metac-deepseek-r1+sonar",
      userId: 269777,
      totalSpotScore: 150.45,
      take: 22636.39,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 41,
      username: "TextQLBot",
      userId: 272775,
      totalSpotScore: 148.84,
      take: 22152.35,
      prize: null,
    },
    {
      rank: 42,
      username: "vigjibot",
      userId: 261115,
      totalSpotScore: 130.18,
      take: 16946.6,
      prize: null,
    },
    {
      rank: 43,
      username: "metac-deepseek-r1+gpt-4o-search-preview",
      userId: 269782,
      totalSpotScore: 85.84,
      take: 7368.81,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 44,
      username: "plogic_claude_bot",
      userId: 270045,
      totalSpotScore: 22.23,
      take: 494.15,
      prize: null,
    },
    {
      rank: 45,
      username: "laylaps",
      userId: 246118,
      totalSpotScore: 7.49,
      take: 56.06,
      prize: null,
    },
    {
      rank: 46,
      username: "metac-deepseek-r1+sonar-pro",
      userId: 269776,
      totalSpotScore: -4.39,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 47,
      username: "metac-gemini-2-5-pro+exa-pro",
      userId: 269775,
      totalSpotScore: -36.59,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 48,
      username: "metac-claude-3-5-sonnet-latest+asknews",
      userId: 236040,
      totalSpotScore: -41.4,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 49,
      username: "metac-gpt-4-1-mini+asknews",
      userId: 269792,
      totalSpotScore: -92.6,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 50,
      username: "AI_ex",
      userId: 271014,
      totalSpotScore: -136.36,
      take: 0.0,
      prize: null,
    },
    {
      rank: 51,
      username: "forecastcorpbot",
      userId: 273612,
      totalSpotScore: -174.03,
      take: 0.0,
      prize: null,
    },
    {
      rank: 52,
      username: "MarcoMaster9527",
      userId: 269847,
      totalSpotScore: -269.64,
      take: 0.0,
      prize: null,
    },
    {
      rank: 53,
      username: "javebot",
      userId: 269844,
      totalSpotScore: -304.31,
      take: 0.0,
      prize: null,
    },
    {
      rank: 54,
      username: "metac-claude-3-5-sonnet-20240620+asknews",
      userId: 236041,
      totalSpotScore: -362.8,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 55,
      username: "MMXCVIII",
      userId: 269858,
      totalSpotScore: -399.24,
      take: 0.0,
      prize: null,
    },
    {
      rank: 56,
      username: "plogicbot",
      userId: 269883,
      totalSpotScore: -485.49,
      take: 0.0,
      prize: null,
    },
    {
      rank: 57,
      username: "metac-deepseek-r1+gemini-2-5-pro-grounding",
      userId: 269783,
      totalSpotScore: -500.88,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 58,
      username: "000_bot",
      userId: 191284,
      totalSpotScore: -507.71,
      take: 0.0,
      prize: null,
    },
    {
      rank: 59,
      username: "metac-only-sonar-reasoning-pro",
      userId: 269781,
      totalSpotScore: -540.97,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 60,
      username: "metac-deepseek-r1+exa-answer",
      userId: 269785,
      totalSpotScore: -622.12,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 61,
      username: "metac-gpt-4-1+asknews",
      userId: 269791,
      totalSpotScore: -629.16,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 62,
      username: "metac-claude-3-7-sonnet+asknews",
      userId: 269195,
      totalSpotScore: -637.89,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 63,
      username: "htimm_bot",
      userId: 270125,
      totalSpotScore: -686.83,
      take: 0.0,
      prize: null,
    },
    {
      rank: 64,
      username: "under_the_waves2",
      userId: 269931,
      totalSpotScore: -710.18,
      take: 0.0,
      prize: null,
    },
    {
      rank: 65,
      username: "BotComp1ex",
      userId: 269304,
      totalSpotScore: -741.57,
      take: 0.0,
      prize: null,
    },
    {
      rank: 66,
      username: "cookics_bot_TEST",
      userId: 224797,
      totalSpotScore: -762.86,
      take: 0.0,
      prize: null,
    },
    {
      rank: 67,
      username: "metac-deepseek-r1+exa-smart-searcher",
      userId: 269784,
      totalSpotScore: -786.01,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 68,
      username: "test-carse",
      userId: 270838,
      totalSpotScore: -865.67,
      take: 0.0,
      prize: null,
    },
    {
      rank: 69,
      username: "CatrachoCaster",
      userId: 241715,
      totalSpotScore: -876.81,
      take: 0.0,
      prize: null,
    },
    {
      rank: 70,
      username: "cyberbox",
      userId: 268533,
      totalSpotScore: -934.78,
      take: 0.0,
      prize: null,
    },
    {
      rank: 71,
      username: "metac-gemini-2-5-flash+asknews",
      userId: 269794,
      totalSpotScore: -958.79,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 72,
      username: "NextWorldLab",
      userId: 237476,
      totalSpotScore: -980.42,
      take: 0.0,
      prize: null,
    },
    {
      rank: 73,
      username: "luoji_bot",
      userId: 270093,
      totalSpotScore: -1017.01,
      take: 0.0,
      prize: null,
    },
    {
      rank: 74,
      username: "red_is_dead",
      userId: 269275,
      totalSpotScore: -1059.45,
      take: 0.0,
      prize: null,
    },
    {
      rank: 75,
      username: "metac-deepseek-v3+asknews",
      userId: 269201,
      totalSpotScore: -1261.94,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 76,
      username: "metac-deepseek-r1+sonar-reasoning",
      userId: 269780,
      totalSpotScore: -1275.05,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 77,
      username: "metac-deepseek-r1+sonar-deep-research",
      userId: 269778,
      totalSpotScore: -1326.13,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 78,
      username: "metac-gemini-2-5-pro+gemini-2-5-pro-grounding",
      userId: 269773,
      totalSpotScore: -1355.71,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 79,
      username: "OliveTestBot",
      userId: 270853,
      totalSpotScore: -1380.43,
      take: 0.0,
      prize: null,
    },
    {
      rank: 80,
      username: "metac-llama-4-maverick-17b+asknews",
      userId: 269198,
      totalSpotScore: -1484.9,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 81,
      username: "metac-o3-mini-high+asknews",
      userId: 269189,
      totalSpotScore: -1531.52,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 82,
      username: "metac-gpt-4o+asknews",
      userId: 236038,
      totalSpotScore: -1539.81,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 83,
      username: "Henryb_bot",
      userId: 255760,
      totalSpotScore: -1663.17,
      take: 0.0,
      prize: null,
    },
    {
      rank: 84,
      username: "jlbot",
      userId: 269712,
      totalSpotScore: -1858.09,
      take: 0.0,
      prize: null,
    },
    {
      rank: 85,
      username: "metac-o1-mini+asknews",
      userId: 269190,
      totalSpotScore: -1885.31,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 86,
      username: "ChrisBot",
      userId: 269734,
      totalSpotScore: -2065.65,
      take: 0.0,
      prize: null,
    },
    {
      rank: 87,
      username: "metac-gpt-4o-mini+asknews",
      userId: 269193,
      totalSpotScore: -2320.4,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 88,
      username: "metac-uniform-probability-bot",
      userId: 269204,
      totalSpotScore: -2402.04,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 89,
      username: "bottles",
      userId: 205182,
      totalSpotScore: -2806.1,
      take: 0.0,
      prize: null,
    },
    {
      rank: 90,
      username: "johnny5bot",
      userId: 268247,
      totalSpotScore: -3489.5,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 91,
      username: "Grizeu_Bot",
      userId: 222631,
      totalSpotScore: -3643.42,
      take: 0.0,
      prize: null,
    },
    {
      rank: 92,
      username: "decis-ai-bot1",
      userId: 268244,
      totalSpotScore: -3852.28,
      take: 0.0,
      prize: null,
    },
    {
      rank: 93,
      username: "metac-gpt-4-1-nano+asknews",
      userId: 269793,
      totalSpotScore: -3949.25,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 94,
      username: "metac-deepseek-r1+asknews-deepnews",
      userId: 269786,
      totalSpotScore: -3993.94,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
    {
      rank: 95,
      username: "Sedentis",
      userId: 270041,
      totalSpotScore: -4216.36,
      take: 0.0,
      prize: null,
    },
    {
      rank: 96,
      username: "metac-gpt-3-5-turbo+asknews",
      userId: 269192,
      totalSpotScore: -5273.04,
      take: 0.0,
      prize: null,
      isMetacBot: true,
    },
  ];

  return (
    <div className="flex size-full max-h-[420px] min-h-[300px] flex-col items-stretch gap-1 overflow-y-auto rounded bg-white p-4 dark:bg-blue-100-dark md:gap-2 min-[1920px]:max-h-[680px] min-[1920px]:gap-4 min-[1920px]:p-12">
      <h3 className="my-0 text-center text-lg text-blue-800 dark:text-blue-800-dark min-[1920px]:text-3xl">
        Q2 2025 Bot Leaderboard
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
