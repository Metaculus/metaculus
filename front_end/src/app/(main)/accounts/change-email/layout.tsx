import { FC, PropsWithChildren } from "react";

const ChangeEmailLayout: FC<PropsWithChildren> = ({ children }) => (
  <main className="mx-auto min-h-min w-full max-w-3xl flex-auto rounded bg-gray-0 px-4 py-6 dark:bg-gray-0-dark sm:p-8 lg:my-8">
    {children}
  </main>
);

export default ChangeEmailLayout;
