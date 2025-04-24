"use client";

import NextError from "next/error";
import { useEffect } from "react";

import { logError } from "@/utils/core/errors";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    logError(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
