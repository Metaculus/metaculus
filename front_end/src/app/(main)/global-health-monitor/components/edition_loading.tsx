import LogoTraceLoader from "@/components/ui/logo_trace_loader";

/**
 * Stands in for a past edition's body while its curves load. It fades in only after 0.4s, so a
 * cached edition never flashes it; being CSS, the delay also holds before hydration.
 * `data-loading` makes the PDF screenshot wait for the real content.
 */
export function EditionLoading({ message }: { message: string }) {
  return (
    <div
      data-loading="true"
      className="flex min-h-[60vh] items-center justify-center rounded-md bg-gray-0 px-4 dark:bg-gray-0-dark"
    >
      <div className="flex animate-fade-in flex-col items-center gap-4 [animation-delay:400ms] [animation-fill-mode:both]">
        <LogoTraceLoader
          size={48}
          className="text-blue-700 dark:text-blue-700-dark"
          ariaLabel={message}
        />
        <p className="m-0 text-center text-gray-600 dark:text-gray-600-dark">
          {message}
        </p>
      </div>
    </div>
  );
}
