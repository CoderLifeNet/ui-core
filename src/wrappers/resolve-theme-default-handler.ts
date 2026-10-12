import type { Theme } from "@mui/material/styles";
import { useDefaultProps } from "@mui/material/DefaultPropsProvider";

export function useResolvedDefaultProp<T>(
  _theme: Theme,
  componentKey: keyof NonNullable<Theme["components"]>,
  propName: string,
  value: T | undefined
): T | undefined {
  const resolved = useDefaultProps({
    name: componentKey as string,
    props: {
      [propName]: value
    } as Record<string, unknown>
  }) as Record<string, unknown>;

  return resolved[propName] as T | undefined;
}

export function useResolvedDefaultHandler<T>(
  theme: Theme,
  componentKey: keyof NonNullable<Theme["components"]>,
  propName: string,
  userHandler: T | undefined
): T | undefined {
  const resolved = useResolvedDefaultProp(theme, componentKey, propName, userHandler);
  return typeof resolved === "function" ? (resolved as T) : userHandler;
}
