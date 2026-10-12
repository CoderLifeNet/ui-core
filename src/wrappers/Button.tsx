"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiButton from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type ButtonRef = ComponentPropsWithRef<typeof MuiButton>["ref"];
type ButtonClickArgs = Parameters<NonNullable<ButtonProps["onClick"]>>;

function ButtonImpl(inProps: ButtonProps, ref: ButtonRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onClick, ...props } = inProps;
  const resolvedOnClick = resolveThemeDefaultHandler<ButtonProps["onClick"]>(theme, "MuiButton", "onClick", onClick);

  return (
    <MuiButton
      {...props}
      ref={ref}
      onClick={composeHandler<ButtonClickArgs>({
        userHandler: resolvedOnClick,
        emit,
        dedupeKey: "click:Button",
        eventFactory: () => ({
          type: "ui.button.click",
          action: "click",
          component: "Button",
          metadata: {
            variant: inProps.variant ?? "text",
            color: inProps.color ?? "primary"
          }
        })
      })}
    />
  );
}

export const Button = preserveComponentType(forwardRef(ButtonImpl) as unknown as typeof MuiButton, MuiButton);
export default Button;
