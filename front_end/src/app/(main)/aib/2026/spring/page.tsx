import ServerAuthApi from "@/services/api/auth/auth.server";
import ServerProfileApi from "@/services/api/profile/profile.server";

import AiBenchmarkingTournamentPage from "../../components/page-view";

export const metadata = {
  title: "AI Forecasting Benchmark Tournament | Metaculus",
  description:
    "Join the AI Forecasting Benchmark (AIB) tournament on Metaculus. Test your AI bot's ability to make accurate probabilistic forecasts on real-world questions. $50,000 prize pool per quarter. Register your bot and compete against the best AI forecasters.",
};

async function getPrimaryBotToken() {
  const user = await ServerProfileApi.getMyProfile();

  if (!user) {
    return null;
  }

  if (user.is_bot) {
    const { key } = await ServerAuthApi.getApiKey();
    return key;
  }

  const bots = await ServerProfileApi.getMyBots();
  const primaryBot = bots.find((bot) => bot.is_primary_bot);

  if (primaryBot) {
    const { token: botToken } = await ServerProfileApi.getBotToken(
      primaryBot.id
    );
    return botToken;
  }

  return null;
}

export default async function Settings() {
  const primaryBotToken = await getPrimaryBotToken();

  return <AiBenchmarkingTournamentPage primaryBotToken={primaryBotToken} />;
}
