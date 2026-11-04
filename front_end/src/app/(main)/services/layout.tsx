import { ReactNode } from "react";

import RedditPageTracker from "./components/reddit_page_tracker";

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RedditPageTracker />
      {children}
    </>
  );
}
