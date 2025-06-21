"use client";
import { useRouter } from "next/navigation";
import { FC, useEffect } from "react";

import LoadingIndicator from "@/components/ui/loading_indicator";
type Props = {
  id: number;
  slug: string[];
};

/**
 * This component handles client-side redirection to notebook pages while preserving
 * URL hash fragments, as hash fragments are not included in server-side requests.
 */
const NotebookRedirect: FC<Props> = ({ id, slug }) => {
  const router = useRouter();
  useEffect(() => {
    const hash = window.location.hash;

    router.replace(
      `/notebooks/${id}${slug ? `/${slug}` : ""}${hash ? `${hash}` : ""}`
    );
  }, []);

  return <LoadingIndicator />;
};

export default NotebookRedirect;
