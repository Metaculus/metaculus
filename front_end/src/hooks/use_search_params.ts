import {
  useRouter,
  usePathname,
  useSearchParams as usePageSearchParams,
} from "next/navigation";
import { useCallback, useMemo } from "react";

const useSearchParams = () => {
  const searchParams = usePageSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const params = useMemo(
    () => new URLSearchParams(searchParams),
    [searchParams]
  );

  const navigateToSearchParams = useCallback(() => {
    router.push(pathname + "?" + params.toString());
  }, [params, pathname, router]);

  const setParam = useCallback(
    (name: string, val: string | string[], withNavigation = true) => {
      params.delete(name);

      if (Array.isArray(val)) {
        val.map((value) => params.append(name, encodeURIComponent(value)));
      } else {
        params.append(name, encodeURIComponent(val));
      }

      if (!withNavigation) {
        return;
      }
      navigateToSearchParams();
    },
    [navigateToSearchParams, params]
  );

  const deleteParam = useCallback(
    (name: string, withNavigation = true, value?: string) => {
      params.delete(name, value);

      if (!withNavigation) {
        return;
      }
      navigateToSearchParams();
    },
    [params, navigateToSearchParams]
  );

  const deleteParams = useCallback(
    (names: string[], withNavigation = true) => {
      names.forEach((name) => params.delete(name));

      if (!withNavigation) {
        return;
      }
      navigateToSearchParams();
    },
    [navigateToSearchParams, params]
  );

  const replaceParams = useCallback(
    (
      oldParams: string[],
      newParams: Array<{ name: string; value: string | string[] }>,
      withNavigation = true
    ) => {
      oldParams.forEach((name) => params.delete(name));
      newParams.forEach(({ name, value }) => {
        if (Array.isArray(value)) {
          value.map((val) => params.append(name, encodeURIComponent(val)));
        } else {
          params.append(name, encodeURIComponent(value));
        }
      });

      if (!withNavigation) {
        return;
      }
      navigateToSearchParams();
    },
    [navigateToSearchParams, params]
  );

  return {
    params,
    setParam,
    deleteParam,
    deleteParams,
    replaceParams,
    navigateToSearchParams,
  };
};

export default useSearchParams;
