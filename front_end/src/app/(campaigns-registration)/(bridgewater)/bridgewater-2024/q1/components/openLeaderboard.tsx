import Link from "next/link";

function OpenLeaderboard() {
  return (
    <div className="flex size-full max-h-[420px] min-h-[300px] flex-col items-stretch gap-1 overflow-y-auto rounded bg-white p-4 dark:bg-blue-100-dark md:gap-2 min-[1920px]:max-h-[800px] min-[1920px]:gap-4 min-[1920px]:p-12">
      <h3 className="my-0 text-center text-lg text-blue-800 dark:text-blue-800-dark min-[1920px]:text-3xl">
        Open Leaderboard
      </h3>
      <table className="size-full">
        <thead>
          <tr className="h-8 min-[1920px]:h-10">
            <th className="text-center">Rank</th>
            <th className="pl-2 text-left">Forecaster</th>
            <th className="text-right">Total Score</th>
            <th className="text-right">Prize</th>
          </tr>
        </thead>
        <tbody className="text-sm min-[1920px]:text-xl">
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">1</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/173843/">Mvem</Link>
            </td>
            <td className="text-right">1,678.3</td>
            <td className="text-right">$260</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">2</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/100655/">v</Link>
            </td>
            <td className="text-right">1,597.9</td>
            <td className="text-right">$240</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">3</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/133827/">partlygloudy</Link>
            </td>
            <td className="text-right">1,530.5</td>
            <td className="text-right">$225</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">4</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/109742/">katifish</Link>
            </td>
            <td className="text-right">1,521.3</td>
            <td className="text-right">$222</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">5</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/131523/">SpottedBear</Link>
            </td>
            <td className="text-right">1,513.5</td>
            <td className="text-right">$221</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">6</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/116628/">dominicd</Link>
            </td>
            <td className="text-right">1,510.6</td>
            <td className="text-right">$220</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">7</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/103777/">datscilly</Link>
            </td>
            <td className="text-right">1,506.2</td>
            <td className="text-right">$219</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">8</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/102808/">Skerry</Link>
            </td>
            <td className="text-right">1,469.4</td>
            <td className="text-right">$211</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">9</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/130770/">SemioticRivalry</Link>
            </td>
            <td className="text-right">1,433.3</td>
            <td className="text-right">$203</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">10</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/121071/">cookics999</Link>
            </td>
            <td className="text-right">1,414.6</td>
            <td className="text-right">$199</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default OpenLeaderboard;
