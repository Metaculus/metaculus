import cn from "classnames";
import { ButtonHTMLAttributes, FC, PropsWithChildren } from "react";

type Variant = "green" | "red" | "neutral";

type LikelihoodButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    selected?: boolean;
    variant: Variant;
  }
>;

export const LikelihoodButton: FC<LikelihoodButtonProps> = ({
  children,
  selected,
  variant,
  className,
  ...rest
}) => {
  const variantClasses: Record<Variant, string> = {
    green: cn(
      "border-mint-400 text-mint-700 hover:border-mint-700 hover:text-mint-800",
      "active:border-mint-700 active:text-mint-800",
      "data-[selected=true]:bg-mint-700 data-[selected=true]:text-gray-0 data-[selected=true]:border-mint-700",
      "dark:border-mint-400-dark dark:text-mint-700-dark dark:hover:border-mint-700-dark dark:hover:text-mint-800-dark",
      "dark:active:border-mint-700-dark dark:active:text-mint-800-dark",
      "dark:data-[selected=true]:bg-mint-700-dark dark:data-[selected=true]:border-mint-700-dark dark:data-[selected=true]:text-gray-0-dark"
    ),

    red: cn(
      "border-salmon-300 text-salmon-700 hover:border-salmon-700 hover:text-salmon-800",
      "active:border-salmon-700 active:text-salmon-800",
      "data-[selected=true]:bg-salmon-700 data-[selected=true]:border-salmon-700 data-[selected=true]:text-gray-0",
      "dark:border-salmon-300-dark dark:text-salmon-700-dark dark:hover:border-salmon-700-dark dark:hover:text-salmon-800-dark",
      "dark:active:border-salmon-700-dark dark:active:text-salmon-800-dark",
      "dark:data-[selected=true]:bg-salmon-700-dark dark:data-[selected=true]:border-salmon-700-dark dark:data-[selected=true]:text-gray-0-dark"
    ),

    neutral: cn(
      "border-blue-400 text-blue-700 hover:border-blue-700 hover:text-blue-800",
      "active:border-blue-700 active:text-blue-800",
      "data-[selected=true]:bg-blue-700 data-[selected=true]:border-blue-700 data-[selected=true]:text-gray-0",
      "dark:border-blue-400-dark dark:text-blue-700-dark dark:hover:border-blue-700-dark dark:hover:text-blue-800-dark",
      "dark:active:border-blue-700-dark dark:active:text-blue-800-dark",
      "dark:data-[selected=true]:bg-blue-700-dark dark:data-[selected=true]:border-blue-700-dark dark:data-[selected=true]:text-gray-0-dark"
    ),
  };

  return (
    <button
      type="button"
      {...rest}
      data-selected={selected}
      className={cn(
        "rounded-[1px] border px-1.5 py-1 text-xs capitalize leading-none outline-none transition-colors duration-150",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export default LikelihoodButton;
