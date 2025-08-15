import "@fortawesome/fontawesome-svg-core/styles.css";

import { redirect } from "next/navigation";

import ServerProfileApi from "@/services/api/profile/profile.server";
import { getServerSession } from "@/services/session";

import SettingsHeader from "./components/settings_header";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getServerSession();
  const currentUser = await ServerProfileApi.getMyProfile();

  if (!token || !currentUser) return redirect("/");

  return (
    <main className="mx-auto min-h-min w-full max-w-3xl flex-auto rounded bg-gray-0 p-4 dark:bg-gray-0-dark lg:my-8">
      <SettingsHeader />
      <section className="mt-6">{children}</section>
    </main>
  );
}
