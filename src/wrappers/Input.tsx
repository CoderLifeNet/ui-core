"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiInput from "@mui/material/Input";
import type { InputProps } from "@mui/material/Input";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type InputRef = ComponentPropsWithRef<typeof MuiInput>["ref"];
type InputChangeArgs = Parameters<NonNullable<InputProps["onChange"]>>;
type InputFocusArgs = Parameters<NonNullable<InputProps["onFocus"]>>;
type InputBlurArgs = Parameters<NonNullable<InputProps["onBlur"]>>;

function InputImpl(inProps: InputProps, ref: InputRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = useResolvedDefaultHandler<InputProps["onChange"]>(theme, "MuiInput", "onChange", onChange);
  const resolvedOnFocus = useResolvedDefaultHandler<InputProps["onFocus"]>(theme, "MuiInput", "onFocus", onFocus);
  const resolvedOnBlur = useResolvedDefaultHandler<InputProps["onBlur"]>(theme, "MuiInput", "onBlur", onBlur);

  return (
    <MuiInput
      {...props}
      ref={ref}
      onChange={composeHandler<InputChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:Input",
        eventFactory: () => ({
          type: "ui.input.change",
          action: "change",
          component: "Input"
        })
      })}
      onFocus={composeHandler<InputFocusArgs>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:Input",
        eventFactory: () => ({
          type: "ui.input.focus",
          action: "focus",
          component: "Input"
        })
      })}
      onBlur={composeHandler<InputBlurArgs>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:Input",
        eventFactory: () => ({
          type: "ui.input.blur",
          action: "blur",
          component: "Input"
        })
      })}
    />
  );
}

export const Input = preserveComponentType(forwardRef(InputImpl) as unknown as typeof MuiInput, MuiInput);
export default Input;
