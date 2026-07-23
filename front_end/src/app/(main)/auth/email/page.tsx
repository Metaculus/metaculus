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

  return (
    <main className="mx-auto flex min-h-min w-full max-w-3xl flex-auto flex-col items-center rounded bg-gray-0 px-4 py-10 dark:bg-gray-0-dark sm:p-8 lg:my-8">
      <noscript>{t("emailLinkNoScript")}</noscript>
      <EmailLinkVerify
        userId={user_id ?? ""}
        token={token ?? ""}
        redirectUrl={redirect_url ?? ""}
      />
    </main>
  );
}
