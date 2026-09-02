import { AnimationEventHandler, FC } from "react";

import LoadingIndicator from "@/components/ui/loading_indicator";
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
 * between them flashes, so the markup lives here rather than in either.
 */
const SigningInPanel: FC<Props> = ({ message, className, onAnimationEnd }) => (
  <div
    onAnimationEnd={onAnimationEnd}
    className={cn(
      "flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-blue-200 px-4 dark:bg-blue-50-dark",
      className
    )}
  >
    <LoadingIndicator />
    <p className="m-0 text-center text-gray-600 dark:text-gray-600-dark">
      {message}
    </p>
  </div>
);

export default SigningInPanel;
