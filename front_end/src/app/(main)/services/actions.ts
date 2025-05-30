"use server";

import serverMiscApi from "@/services/api/misc/misc.server";
import { GetInTouchForm } from "@/services/api/misc/misc.shared";

export async function submitGetInTouchForm(data: GetInTouchForm) {
  return await serverMiscApi.submitGetInTouchForm(data);
}
