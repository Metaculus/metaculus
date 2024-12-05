import Bulletins from "../../(main)/components/bulletins";
import CookiesBanner from "../../(main)/components/cookies_banner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Bulletins />
      <div className="mx-auto flex flex-grow">{children}</div>
      <CookiesBanner />
    </div>
  );
}
