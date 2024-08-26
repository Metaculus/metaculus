import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import LoadingIndicator from "@/components/ui/loading_indicator";

import AsyncTrackRecord from "./components/async_track_record";

export default async function TrackRecordPage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto mb-16 mt-4 min-h-min w-full max-w-[780px] flex-auto rounded bg-gray-0 px-3 py-1 dark:bg-gray-0-dark">
      <hr />
      <h2>{t("metaculusTrackRecord")}</h2>
      <div>
        <p>
          {t.rich("trackRecordOutdatedMessage", {
            link: (chunks) => (
              <Link href={"/help/scores-faq/#tournaments"}>{chunks}</Link>
            ),
          })}
        </p>
      </div>
      <hr />

      <Suspense fallback={<LoadingIndicator />}>
        <AsyncTrackRecord />
      </Suspense>
    </main>
  );
}
