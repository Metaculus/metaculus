import React, { useMemo } from "react";

type ConditionalTransform<T> = {
  when: (args: T) => boolean;
  transform: (args: T) => T;
  key?: string;
};

type ConditionalRendererOptions<T> = {
  componentSelector: (args: T) => React.ComponentType<T>;
  transformRules?: ConditionalTransform<T>[];
  buildKey?: (args: T, appliedKeys: string[]) => string;
};

export function createConditionalRenderer<T extends Record<string, unknown>>(
  options: ConditionalRendererOptions<T>
) {
  const { componentSelector, transformRules = [], buildKey } = options;

  const ConditionalRenderer = (args: T) => {
    const { finalArgs, appliedKeys } = useMemo(() => {
      const keys: string[] = [];
      const transformed = transformRules.reduce((acc, rule) => {
        if (rule.when(acc)) {
          keys.push(rule.key ?? "rule");
          return rule.transform(acc);
        }
        return acc;
      }, args);
      return { finalArgs: transformed, appliedKeys: keys };
    }, [args]);

    const Component = componentSelector(finalArgs);
    const key = buildKey
      ? buildKey(finalArgs, appliedKeys)
      : appliedKeys.length
        ? appliedKeys.join("-")
        : "conditional";

    return <Component key={key} {...finalArgs} />;
  };

  ConditionalRenderer.displayName = "ConditionalRenderer";
  return ConditionalRenderer;
}
