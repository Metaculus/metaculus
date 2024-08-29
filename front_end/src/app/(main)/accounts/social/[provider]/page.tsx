import ExchangeSocialAuthCode from "@/app/(main)/accounts/social/[provider]/components/exchange_social_auth_code";
import { SocialProviderType } from "@/types/auth";
import { SearchParams } from "@/types/navigation";

export default async function SocialAuth({
  params: { provider },
  searchParams,
}: {
  params: { provider: SocialProviderType };
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto my-12 flex min-h-min w-full max-w-5xl flex-col gap-4 px-3 lg:px-0">
      <ExchangeSocialAuthCode
        code={searchParams.code as string}
        provider={provider}
      />
    </main>
  );
}
