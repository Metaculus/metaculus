import {
  FacebookPixelTag,
  LinkedInInsightTag,
  RedditPixelTag,
} from "./components/pixels-tags";
import CookiesBanner from "../../../(main)/components/cookies_banner";
import Footer from "../../../(main)/components/footer";

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
      <RedditPixelTag pixelID="a2_g9su7byjf9mu" />
      <CookiesBanner />
      <Footer />
    </div>
  );
}
