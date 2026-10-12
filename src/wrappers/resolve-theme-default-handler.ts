import type { Theme } from "@mui/material/styles";

export function resolveThemeDefaultHandler<T>(
  theme: Theme,
  componentKey: keyof NonNullable<Theme["components"]>,
  propName: string,
  userHandler: T | undefined
): T | undefined {
  if (userHandler) {
    return userHandler;
  }

  const componentConfig = theme.components?.[componentKey] as { defaultProps?: Record<string, unknown> } | undefined;
  const defaultProps = componentConfig?.defaultProps;
  const handler = defaultProps?.[propName];
  return typeof handler === "function" ? (handler as T) : undefined;
}
