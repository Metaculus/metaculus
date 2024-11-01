"use client";

import { usePathname } from "next/navigation";
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
};

export const NavigationContext = createContext<NavigationContextType>({
  previousPath: null,
  currentPath: null,
});

const NavigationProvider: FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const [path, setPath] = useState<NavigationContextType>({
    previousPath: null,
    currentPath: null,
  });

  useEffect(() => {
    setPath((prevPath) => {
      return pathname === prevPath.currentPath
        ? prevPath
        : { previousPath: prevPath.currentPath, currentPath: pathname };
    });
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ ...path }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
export default NavigationProvider;
