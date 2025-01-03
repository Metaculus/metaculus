import CookiesBanner from "../../(main)/components/cookies_banner";
import { FacebookPixelTag, LinkedInInsightTag } from "./components/pixels-tags";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full min-h-screen">
      <div className="h-full">{children}</div>
      <FacebookPixelTag pixelID="2365278530483021" />
      <LinkedInInsightTag partnerID="6757148" />
      <CookiesBanner />
    </div>
  );
}
