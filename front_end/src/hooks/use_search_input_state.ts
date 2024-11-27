import { useEffect, useState } from "react";

import { POST_ORDER_BY_FILTER, POST_PAGE_FILTER } from "@/constants/posts_feed";
import useDebounce from "@/hooks/use_debounce";
import useSearchParams from "@/hooks/use_search_params";
import { QuestionOrder } from "@/types/question";

type Config = {
  debounceTime?: number;
  mode?: "server" | "client";
};

const useSearchInputState = (paramName: string, config?: Config) => {
  const { debounceTime = 500, mode = "server" } = config ?? {};

  const { params, setParam, deleteParam, shallowNavigateToSearchParams } =
    useSearchParams();

  const [search, setSearch] = useState(() => {
    const search = params.get(paramName);
    return search ? decodeURIComponent(search) : "";
  });
  const debouncedSearch = useDebounce(search, debounceTime);

  useEffect(() => {
    const withNavigation = mode === "server";

    if (debouncedSearch) {
      // Auto-append -rank ordering for server search
      if (withNavigation && !params.get(POST_ORDER_BY_FILTER)) {
        setParam(POST_ORDER_BY_FILTER, QuestionOrder.RankDesc, withNavigation);
      }
      // Auto-remove page filter on input change
      deleteParam(POST_PAGE_FILTER, false);
      setParam(paramName, debouncedSearch, withNavigation);
    } else {
      // Auto-remove -rank ordering for server search
      if (
        withNavigation &&
        params.get(POST_ORDER_BY_FILTER) === QuestionOrder.RankDesc
      ) {
        deleteParam(POST_ORDER_BY_FILTER, withNavigation);
      }
      // Auto-remove page filter on input change
      deleteParam(POST_PAGE_FILTER, false);
      deleteParam(paramName, withNavigation);
    }

    if (!withNavigation) {
      shallowNavigateToSearchParams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, mode, paramName]);

  return [search, setSearch] as const;
};

export default useSearchInputState;
