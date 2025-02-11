import { notFound } from "next/navigation";

// ensure 404 UI is rendered under (main) layout
export default function NotFoundRoute() {
  notFound();
}
