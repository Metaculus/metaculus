import CookiesBanner from "../../(main)/components/cookies_banner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full min-h-screen">
      <div className="h-full">{children}</div>
      <CookiesBanner />
    </div>
  );
}
