import { user } from "../../user";
import DemoWrapper from "./demoWrapper";
import Redirect from "./redirect";

export default function AiBenchmarkingDemoPage() {
  const isUserAuthenticated = user.isAuthenticated;
  const isUserBot = isUserAuthenticated && user.forecaster_type === "BOT";

  return (
    <>
      {!isUserAuthenticated && <Redirect />}
      {isUserAuthenticated && isUserBot && <DemoWrapper />}
      {isUserAuthenticated && !isUserBot && <Redirect />}
    </>
  );
}
