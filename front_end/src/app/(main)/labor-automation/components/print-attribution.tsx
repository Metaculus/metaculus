"use client";

export function PrintAttribution() {
  const url =
    typeof window !== "undefined"
      ? window.location.hostname + window.location.pathname
      : "";

  return (
    <div className="hidden print:block print:py-6 print:text-center print:text-sm print:text-gray-700">
      {url} —{" "}
      {new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </div>
  );
}
