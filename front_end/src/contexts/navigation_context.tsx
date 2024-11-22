"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

type NavigationContextType = {
  previousPath: null | string;
  currentPath: null | string;
  currentPathname: null | string;
};

export const NavigationContext = createContext<NavigationContextType>({
  previousPath: null,
  currentPath: null,
  currentPathname: null,
});

const NavigationProvider: FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const [path, setPath] = useState<NavigationContextType>({
    previousPath: null,
    currentPath: null,
    currentPathname: null,
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    const fullPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    setPath((prevPath) => {
      return fullPath === prevPath.currentPath
        ? prevPath
        : {
            previousPath: prevPath.currentPath,
            currentPath: fullPath,
            currentPathname: pathname,
          };
    });
  }, [pathname, searchParams]);

  return (
    <NavigationContext.Provider value={{ ...path }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
export default NavigationProvider;
