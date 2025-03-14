"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const getHash = () =>
  typeof window !== "undefined"
    ? decodeURIComponent(window.location.hash.replace("#", ""))
    : undefined;

const useHash = () => {
  const [hash, setHash] = useState(getHash());
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setHash(getHash());
    // for backward compatibility
    const handleHashChange = () => {
      setHash(getHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [pathname, searchParams]);

  return hash ?? null;
};

export default useHash;
