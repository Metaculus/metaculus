import { isNil } from "lodash";
import { useEffect, useState } from "react";

import { POST_ORDER_BY_FILTER, POST_PAGE_FILTER } from "@/constants/posts_feed";
import { useDebouncedValue } from "@/hooks/use_debounce";
import usePrevious from "@/hooks/use_previous";
import useSearchParams from "@/hooks/use_search_params";
import { QuestionOrder } from "@/types/question";

type Config = {
  debounceTime?: number;
  mode?: "server" | "client";
  modifySearchParams?: boolean;
};

const useSearchInputState = (paramName: string, config?: Config) => {
  const {
    debounceTime = 500,
    mode = "server",
    modifySearchParams = false,
  } = config ?? {};

  const { params, setParam, deleteParam, shallowNavigateToSearchParams } =
    useSearchParams();

  const [search, setSearch] = useState(() => {
    const search = params.get(paramName);
    return search ?? "";
  });
  const debouncedSearch = useDebouncedValue(search, debounceTime);
  const prevDebouncedSearch = usePrevious(debouncedSearch);

  useEffect(() => {
    if (
      isNil(prevDebouncedSearch) ||
      !modifySearchParams ||
      prevDebouncedSearch === debouncedSearch
    ) {
      return;
    }

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
  }, [
    debouncedSearch,
    prevDebouncedSearch,
    mode,
    paramName,
    modifySearchParams,
  ]);

  return [search, setSearch] as const;
};

export default useSearchInputState;
