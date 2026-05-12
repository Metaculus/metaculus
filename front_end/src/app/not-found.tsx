import NotFoundSection from "@/components/not_found_section";
import { getPublicSettings } from "@/utils/public_settings.server";

import FeedbackFloat from "./(main)/(home)/components/feedback_float";
import Footer from "./(main)/components/footer";
import { TopChrome } from "./(main)/components/top_chrome";

const { PUBLIC_MINIMAL_UI } = getPublicSettings();

export default async function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full flex-col text-center">
      <TopChrome />
      <NotFoundSection className="pt-header" />

      {!PUBLIC_MINIMAL_UI && (
        <>
          <FeedbackFloat />
          <Footer />
        </>
      )}
    </div>
  );
}
