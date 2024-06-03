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

  const setParam = useCallback(
    (name: string, val: string | string[]) => {
      params.delete(name);

      if (Array.isArray(val)) {
        val.map((value) => params.append(name, encodeURIComponent(value)));
      } else {
        params.append(name, encodeURIComponent(val));
      }

      router.push(pathname + "?" + params.toString());
    },
    [params, pathname, router]
  );

  const deleteParam = useCallback(
    (name: string) => {
      params.delete(name);

      router.push(pathname + "?" + params.toString());
    },
    [params, router, pathname]
  );

  const deleteParams = useCallback(
    (names: string[]) => {
      names.forEach((name) => params.delete(name));

      router.push(pathname + "?" + params.toString());
    },
    [params, router, pathname]
  );

  return { params, setParam, deleteParam, deleteParams };
};

export default useSearchParams;
