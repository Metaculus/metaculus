import { SearchParams } from "@/types/navigation";
import { PostWithForecasts } from "@/types/post";

export const extractMode = (
  searchParams: SearchParams,
  post?: PostWithForecasts | null
) => {
  let mode = post ? "edit" : "create";
  const paramsMode = searchParams["mode"];
  if (
    typeof paramsMode === "string" &&
    ["create", "edit"].includes(paramsMode)
  ) {
    mode = paramsMode;
  }
  return mode as "create" | "edit";
};
