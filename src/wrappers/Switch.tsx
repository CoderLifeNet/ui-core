"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiSwitch from "@mui/material/Switch";
import type { SwitchProps } from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type SwitchRef = ComponentPropsWithRef<typeof MuiSwitch>["ref"];
type SwitchChangeArgs = Parameters<NonNullable<SwitchProps["onChange"]>>;
type SwitchFocusArgs = Parameters<NonNullable<SwitchProps["onFocus"]>>;
type SwitchBlurArgs = Parameters<NonNullable<SwitchProps["onBlur"]>>;

function SwitchImpl(inProps: SwitchProps, ref: SwitchRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = useResolvedDefaultHandler<SwitchProps["onChange"]>(theme, "MuiSwitch", "onChange", onChange);
  const resolvedOnFocus = useResolvedDefaultHandler<SwitchProps["onFocus"]>(theme, "MuiSwitch", "onFocus", onFocus);
  const resolvedOnBlur = useResolvedDefaultHandler<SwitchProps["onBlur"]>(theme, "MuiSwitch", "onBlur", onBlur);

  return (
    <MuiSwitch
      {...props}
      ref={ref}
      onChange={composeHandler<SwitchChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:Switch",
        eventFactory: () => ({
          type: "ui.switch.change",
          action: "change",
          component: "Switch"
        })
      })}
      onFocus={composeHandler<SwitchFocusArgs>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:Switch",
        eventFactory: () => ({
          type: "ui.switch.focus",
          action: "focus",
          component: "Switch"
        })
      })}
      onBlur={composeHandler<SwitchBlurArgs>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:Switch",
        eventFactory: () => ({
          type: "ui.switch.blur",
          action: "blur",
          component: "Switch"
        })
      })}
    />
  );
}

export const Switch = preserveComponentType(forwardRef(SwitchImpl) as unknown as typeof MuiSwitch, MuiSwitch);
export default Switch;
