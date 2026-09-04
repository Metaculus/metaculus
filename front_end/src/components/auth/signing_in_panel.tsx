import { AnimationEventHandler, FC } from "react";

import LogoTraceLoader from "@/components/ui/logo_trace_loader";
import cn from "@/utils/core/cn";

type Props = {
  message: string;
  className?: string;
  onAnimationEnd?: AnimationEventHandler<HTMLDivElement>;
};

/**
 * The full-viewport panel shown while a magic link is being consumed. Rendered
 * twice by design: once as the verify page itself, and once as the curtain that
 * covers the destination on arrival. Both must look identical or the swap
 * between them flashes, so the markup lives here rather than in either - and
 * for the same reason both show the loader's looping state rather than one of
 * them resolving into the filled mark.
 */
const SigningInPanel: FC<Props> = ({ message, className, onAnimationEnd }) => (
  <div
    onAnimationEnd={onAnimationEnd}
    className={cn(
      "flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-blue-200 px-4 dark:bg-blue-50-dark",
      className
    )}
  >
    <LogoTraceLoader
      size={48}
      className="text-blue-700 dark:text-blue-700-dark"
      ariaLabel={message}
    />
    <p className="m-0 text-center text-gray-600 dark:text-gray-600-dark">
      {message}
    </p>
  </div>
);

export default SigningInPanel;
