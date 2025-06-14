import { Switch as HeadlessSwitch, SwitchProps } from "@headlessui/react";
import React, { FC } from "react";

import cn from "@/utils/core/cn";

type Props = Omit<SwitchProps, "as"> & {
  as?: React.ElementType;
};

const Switch: FC<Props> = ({ className, as = "button", ...props }) => {
  return (
    <HeadlessSwitch
      {...props}
      as={as}
      className={cn(
        "group inline-flex h-6 w-11 items-center rounded-full bg-gray-400 transition data-[checked]:bg-blue-700 dark:bg-gray-400-dark dark:data-[checked]:bg-blue-700-dark",
        className
      )}
    >
      <span className="size-4 translate-x-1 rounded-full bg-blue-100 transition group-data-[checked]:translate-x-6 dark:bg-blue-100-dark" />
    </HeadlessSwitch>
  );
};

export default Switch;
