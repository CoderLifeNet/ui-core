"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiOutlinedInput from "@mui/material/OutlinedInput";
import type { OutlinedInputProps } from "@mui/material/OutlinedInput";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type OutlinedInputRef = ComponentPropsWithRef<typeof MuiOutlinedInput>["ref"];
type OutlinedInputChangeArgs = Parameters<NonNullable<OutlinedInputProps["onChange"]>>;
type OutlinedInputFocusArgs = Parameters<NonNullable<OutlinedInputProps["onFocus"]>>;
type OutlinedInputBlurArgs = Parameters<NonNullable<OutlinedInputProps["onBlur"]>>;

function OutlinedInputImpl(inProps: OutlinedInputProps, ref: OutlinedInputRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = resolveThemeDefaultHandler<OutlinedInputProps["onChange"]>(
    theme,
    "MuiOutlinedInput",
    "onChange",
    onChange
  );
  const resolvedOnFocus = resolveThemeDefaultHandler<OutlinedInputProps["onFocus"]>(
    theme,
    "MuiOutlinedInput",
    "onFocus",
    onFocus
  );
  const resolvedOnBlur = resolveThemeDefaultHandler<OutlinedInputProps["onBlur"]>(theme, "MuiOutlinedInput", "onBlur", onBlur);

  return (
    <MuiOutlinedInput
      {...props}
      ref={ref}
      onChange={composeHandler<OutlinedInputChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:OutlinedInput",
        eventFactory: () => ({
          type: "ui.outlined_input.change",
          action: "change",
          component: "OutlinedInput"
        })
      })}
      onFocus={composeHandler<OutlinedInputFocusArgs>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:OutlinedInput",
        eventFactory: () => ({
          type: "ui.outlined_input.focus",
          action: "focus",
          component: "OutlinedInput"
        })
      })}
      onBlur={composeHandler<OutlinedInputBlurArgs>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:OutlinedInput",
        eventFactory: () => ({
          type: "ui.outlined_input.blur",
          action: "blur",
          component: "OutlinedInput"
        })
      })}
    />
  );
}

export const OutlinedInput = preserveComponentType(
  forwardRef(OutlinedInputImpl) as unknown as typeof MuiOutlinedInput,
  MuiOutlinedInput
);
export default OutlinedInput;
