import { Switch as HeadlessSwitch, SwitchProps } from "@headlessui/react";
import classNames from "classnames";
import React, { FC } from "react";

const Switch: FC<SwitchProps> = ({ className, ...props }) => {
  return (
    <HeadlessSwitch
      {...props}
      className={classNames(
        "group inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition data-[checked]:bg-blue-600",
        className
      )}
    >
      <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
    </HeadlessSwitch>
  );
};

export default Switch;
