import { redirect } from "next/navigation";

import { deleteServerSession } from "@/services/session";

export async function GET(request: Request) {
  deleteServerSession();
  return redirect("/");
}
