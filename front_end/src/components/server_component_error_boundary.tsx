import { FC } from "react";

import RefreshButton from "./refresh_button";

const WithServerComponentErrorBoundary = <P extends {}>(
  Component: FC<P>
): FC<P> => {
  const WrappedComponent = async (props: P) => {
    try {
      return await Component(props);
    } catch (error) {
      if (error instanceof Error) {
        const { digest } = error as Error & { digest?: string };
        return (
          <div className="flex h-[50vh] w-full flex-col items-center justify-center">
            <h2>{digest ?? "Unknown error"}</h2>
            <RefreshButton />
          </div>
        );
      }

      return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center">
          <h2>Unknown error</h2>
          <RefreshButton />
        </div>
      );
    }
  };
  return WrappedComponent as FC<P>;
};

export default WithServerComponentErrorBoundary;
