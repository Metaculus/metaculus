import { FC, PropsWithChildren } from "react";

const MobileMenuTitle: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-full items-center justify-center px-4 pb-1 pt-2 text-sm font-medium uppercase text-gray-200 opacity-50">
      {children}
    </div>
  );
};

export default MobileMenuTitle;
