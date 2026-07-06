import Link from "next/link";

function UndergradLeaderboard() {
  return (
    <div className="flex size-full max-h-[420px] min-h-[300px] flex-col items-stretch gap-1 overflow-y-auto rounded bg-white p-4 dark:bg-blue-100-dark md:gap-2 min-[1920px]:max-h-[800px] min-[1920px]:gap-4 min-[1920px]:p-12">
      <h3 className="my-0 text-center text-lg text-blue-800 dark:text-blue-800-dark min-[1920px]:text-3xl">
        Undergrad Leaderboard
      </h3>
      <table className="size-full">
        <thead>
          <tr className="h-8 min-[1920px]:h-10">
            <th className="text-center">Rank</th>
            <th className="pl-2 text-left">Forecaster</th>
            <th className="pr-2 text-right">Total Score</th>
            <th className="text-right">Prize</th>
          </tr>
        </thead>
        <tbody className="text-sm min-[1920px]:text-xl">
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">1</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/173843/">Mvem</Link>
            </td>
            <td className="pr-2 text-right">1,678.3</td>
            <td className="text-right">$495</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">2</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/116628/">dominicd</Link>
            </td>
            <td className="pr-2 text-right">1510.6</td>
            <td className="text-right">$410</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">3</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/130770/">SemioticRivalry</Link>
            </td>
            <td className="pr-2 text-right">1433.3</td>
            <td className="text-right">$374</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">4</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/121071/">cookics999</Link>
            </td>
            <td className="pr-2 text-right">1414.6</td>
            <td className="text-right">$366</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">5</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/147748/">quinoa</Link>
            </td>
            <td className="pr-2 text-right">1334.6</td>
            <td className="text-right">$331</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">6</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/152151/">freewillisfake</Link>
            </td>
            <td className="pr-2 text-right">1285.9</td>
            <td className="text-right">$311</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">7</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/137899/">nikola</Link>
            </td>
            <td className="pr-2 text-right">1246.8</td>
            <td className="text-right">$295</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">8</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/174571/">GarrettWhite</Link>
            </td>
            <td className="pr-2 text-right">1171.1</td>
            <td className="text-right">$267</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">9</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/169130/">owentyingling</Link>
            </td>
            <td className="pr-2 text-right">1084.5</td>
            <td className="text-right">$236</td>
          </tr>
          <tr className="h-8 min-[1920px]:h-10">
            <td className="text-center">10</td>
            <td className="pl-2 text-left text-base min-[1920px]:text-xl">
              <Link href="/accounts/profile/158421/">shihao</Link>
            </td>
            <td className="pr-2 text-right">1075.4</td>
            <td className="text-right">$233</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default UndergradLeaderboard;
