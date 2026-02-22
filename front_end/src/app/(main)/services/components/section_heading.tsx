import React from "react";

import cn from "@/utils/core/cn";

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  align?: "center" | "left";
};

const SectionHeading: React.FC<Props> = ({
  title,
  subtitle,
  className,
  align = "center",
}) => {
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 antialiased",
        isCenter ? "items-center text-center" : "items-start text-start",
        className
      )}
    >
      <h3 className="m-0 text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark">
        {title}
      </h3>
      {!!subtitle && (
        <p className="m-0 text-pretty text-xl font-medium text-blue-700 dark:text-blue-700-dark">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
