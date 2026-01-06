import { getTranslations } from "next-intl/server";
import invariant from "ts-invariant";

import BotCard from "@/app/(main)/accounts/settings/bots/components/bot_card";
import BotsDisclaimer from "@/app/(main)/accounts/settings/bots/components/bots_disclaimer";
import BotCreateButton from "@/app/(main)/accounts/settings/bots/components/create_button";
import EmptyPlaceholder from "@/app/(main)/accounts/settings/bots/components/empty_placeholder";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getServerSession } from "@/services/session";

import PreferencesSection from "../components/preferences_section";

export const metadata = {
  title: "My Forecasting Bots",
};

export default async function Bots() {
  const token = await getServerSession();
  invariant(token);

  const t = await getTranslations();
  const bots = await ServerProfileApi.getMyBots();

  return (
    <div className="flex flex-col gap-6">
      <BotsDisclaimer />
      <PreferencesSection className="bg-blue-200 p-5 dark:bg-blue-200-dark sm:px-6 sm:py-[18px]">
        <div className="flex items-center justify-between">
          <h3 className="my-0 text-blue-900 dark:text-blue-900-dark">
            {t("myBots")}
          </h3>
          <BotCreateButton disabled={bots.length >= 5} />
        </div>
        <div className="flex flex-col gap-2.5">
          {bots.length > 0 ? (
            bots.map((bot) => <BotCard bot={bot} key={`bot-${bot.id}`} />)
          ) : (
            <EmptyPlaceholder />
          )}
        </div>
      </PreferencesSection>
    </div>
  );
}
