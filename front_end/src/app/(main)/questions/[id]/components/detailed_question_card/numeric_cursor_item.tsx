import classNames from "classnames";
import { FC } from "react";

type Variant = "default" | "prediction" | "my-prediction";

type Props = {
  title: string;
  text: string;
  variant?: Variant;
};

const CursorDetailItem: FC<Props> = ({ title, text, variant = "default" }) => {
  return (
    <div className="flex flex-col items-center whitespace-normal">
      <span className="text-xs">{title}</span>
      <span
        className={classNames(
          "font-bold",
          {
            "text-olive-700 dark:text-olive-700-dark": variant === "prediction",
          },
          {
            "text-orange-800 dark:text-orange-800-dark":
              variant === "my-prediction",
          }
        )}
      >
        {text}
      </span>
    </div>
  );
};

export default CursorDetailItem;
