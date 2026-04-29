import { Children, isValidElement, type ReactNode } from "react";

export function reactNodeToText(node?: ReactNode): string {
  if (!node) return "";
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return reactNodeToText(child.props.children);
      }

      return "";
    })
    .join("");
}
