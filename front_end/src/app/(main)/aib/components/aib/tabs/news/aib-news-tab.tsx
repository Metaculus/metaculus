import React, { Suspense } from "react";

import AwaitedPostsFeed from "@/components/posts_feed";
import LoadingIndicator from "@/components/ui/loading_indicator";

const AIBNewsTab: React.FC = () => (
  <div className="w-full">
    <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
      <Suspense
        fallback={
          <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
        }
      >
        <AwaitedPostsFeed
          filters={{
            tournaments: "futureeval-posts",
          }}
          type="news"
        />
      </Suspense>
    </div>
  </div>
);

export default AIBNewsTab;
