import { redirect } from "next/navigation";

// Redirect /futureeval/info to /futureeval/methodology for backwards compatibility
export default function FutureEvalInfoPage() {
  redirect("/futureeval/methodology");
}
