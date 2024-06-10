import { useEffect, useState } from "react";

import useDebounce from "@/hooks/use_debounce";
import useSearchParams from "@/hooks/use_search_params";

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
      setParam(paramName, debouncedSearch, withNavigation);
    } else {
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
