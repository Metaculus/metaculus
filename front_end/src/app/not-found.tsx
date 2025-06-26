import NotFoundSection from "@/components/not_found_section";
import { getPublicSettings } from "@/utils/public_settings.server";

import FeedbackFloat from "./(main)/(home)/components/feedback_float";
import Footer from "./(main)/components/footer";
import GlobalHeader from "./(main)/components/headers/global_header";

const { PUBLIC_MINIMAL_UI } = getPublicSettings();

export default async function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full flex-col text-center">
      <GlobalHeader />
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
