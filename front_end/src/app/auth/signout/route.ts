import { deleteServerSession } from "@/services/session";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  deleteServerSession();
  return redirect("/");
}
