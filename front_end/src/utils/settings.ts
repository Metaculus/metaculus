"use server";

export async function useMinimalUI() {
  return (
    (process.env.NEXT_PUBLIC_MINIMAL_UI || "false").toLowerCase() === "true"
  );
}
