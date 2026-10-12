"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiInputBase from "@mui/material/InputBase";
import type { InputBaseProps } from "@mui/material/InputBase";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type InputBaseRef = ComponentPropsWithRef<typeof MuiInputBase>["ref"];
type InputBaseChangeArgs = Parameters<NonNullable<InputBaseProps["onChange"]>>;
type InputBaseFocusArgs = Parameters<NonNullable<InputBaseProps["onFocus"]>>;
type InputBaseBlurArgs = Parameters<NonNullable<InputBaseProps["onBlur"]>>;

function InputBaseImpl(inProps: InputBaseProps, ref: InputBaseRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = resolveThemeDefaultHandler<InputBaseProps["onChange"]>(
    theme,
    "MuiInputBase",
    "onChange",
    onChange
  );
  const resolvedOnFocus = resolveThemeDefaultHandler<InputBaseProps["onFocus"]>(theme, "MuiInputBase", "onFocus", onFocus);
  const resolvedOnBlur = resolveThemeDefaultHandler<InputBaseProps["onBlur"]>(theme, "MuiInputBase", "onBlur", onBlur);

  return (
    <MuiInputBase
      {...props}
      ref={ref}
      onChange={composeHandler<InputBaseChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:InputBase",
        eventFactory: () => ({
          type: "ui.input_base.change",
          action: "change",
          component: "InputBase"
        })
      })}
      onFocus={composeHandler<InputBaseFocusArgs>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:InputBase",
        eventFactory: () => ({
          type: "ui.input_base.focus",
          action: "focus",
          component: "InputBase"
        })
      })}
      onBlur={composeHandler<InputBaseBlurArgs>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:InputBase",
        eventFactory: () => ({
          type: "ui.input_base.blur",
          action: "blur",
          component: "InputBase"
        })
      })}
    />
  );
}

export const InputBase = preserveComponentType(forwardRef(InputBaseImpl) as unknown as typeof MuiInputBase, MuiInputBase);
export default InputBase;
