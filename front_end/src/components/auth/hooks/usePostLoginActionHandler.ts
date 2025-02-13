import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { PostLoginAction } from "@/app/(main)/accounts/actions";

const usePostLoginActionHandler = () => {
  const router = useRouter();

  return useCallback(
    (action: PostLoginAction | undefined) => {
      if (!action) {
        return;
      }

      switch (action.type) {
        case "redirect":
          router.replace(action.payload);
          break;
        default:
          console.warn("Unknown post login action type", action);
          break;
      }
    },
    [router]
  );
};

export default usePostLoginActionHandler;
