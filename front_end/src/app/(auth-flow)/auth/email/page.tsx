import { getTranslations } from "next-intl/server";

import EmailLinkVerify from "./components/email_link_verify";

export default async function EmailLinkAuthPage(props: {
  searchParams: Promise<{
    user_id?: string;
    token?: string;
    redirect_url?: string;
  }>;
}) {
  const { user_id, token, redirect_url } = await props.searchParams;
  const t = await getTranslations();

  // Deliberately outside the (main) route group: no navbar, footer or banners,
  // so nothing appears and disappears around the loading state while the link
  // is being consumed.
  return (
    <main className="flex min-h-screen w-full flex-col">
      <noscript className="p-4 text-center">{t("emailLinkNoScript")}</noscript>
      <EmailLinkVerify
        userId={user_id ?? ""}
        token={token ?? ""}
        redirectUrl={redirect_url ?? ""}
      />
    </main>
  );
}
