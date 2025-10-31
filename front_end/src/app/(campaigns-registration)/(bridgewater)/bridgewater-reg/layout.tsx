import CookiesBanner from "../../../(main)/components/cookies_banner";
import Footer from "../../../(main)/components/footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <CookiesBanner />
      <Footer />
    </div>
  );
}
