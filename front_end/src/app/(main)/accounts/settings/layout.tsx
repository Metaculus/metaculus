import "@fortawesome/fontawesome-svg-core/styles.css";

import { redirect } from "next/navigation";

import ServerProfileApi from "@/services/api/profile/profile.server";
import { getAuthCookieManager } from "@/services/auth_tokens";

import SettingsHeader from "./components/settings_header";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authManager = await getAuthCookieManager();
  const currentUser = await ServerProfileApi.getMyProfile();

  if (!authManager.hasAuthSession() || !currentUser) return redirect("/");

  return (
    <main className="mx-auto min-h-min w-full max-w-3xl flex-auto rounded bg-gray-0 px-4 py-6 dark:bg-gray-0-dark sm:p-8 lg:my-8">
      <SettingsHeader />
      <section className="mt-6">{children}</section>
    </main>
  );
}
