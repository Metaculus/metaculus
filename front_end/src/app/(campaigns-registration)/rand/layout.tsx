import { TopChrome } from "@/app/(main)/components/top_chrome";

import CookiesBanner from "../../(main)/components/cookies_banner";
import Footer from "../../(main)/components/footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col pt-header">
      <TopChrome />
      <div className="flex-1">{children}</div>
      <CookiesBanner />
      <Footer />
    </div>
  );
}
