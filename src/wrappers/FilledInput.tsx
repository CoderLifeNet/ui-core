"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiFilledInput from "@mui/material/FilledInput";
import type { FilledInputProps } from "@mui/material/FilledInput";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type FilledInputRef = ComponentPropsWithRef<typeof MuiFilledInput>["ref"];
type FilledInputChangeArgs = Parameters<NonNullable<FilledInputProps["onChange"]>>;
type FilledInputFocusArgs = Parameters<NonNullable<FilledInputProps["onFocus"]>>;
type FilledInputBlurArgs = Parameters<NonNullable<FilledInputProps["onBlur"]>>;

function FilledInputImpl(inProps: FilledInputProps, ref: FilledInputRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = useResolvedDefaultHandler<FilledInputProps["onChange"]>(
    theme,
    "MuiFilledInput",
    "onChange",
    onChange
  );
  const resolvedOnFocus = useResolvedDefaultHandler<FilledInputProps["onFocus"]>(theme, "MuiFilledInput", "onFocus", onFocus);
  const resolvedOnBlur = useResolvedDefaultHandler<FilledInputProps["onBlur"]>(theme, "MuiFilledInput", "onBlur", onBlur);

  return (
    <MuiFilledInput
      {...props}
      ref={ref}
      onChange={composeHandler<FilledInputChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:FilledInput",
        eventFactory: () => ({
          type: "ui.filled_input.change",
          action: "change",
          component: "FilledInput"
        })
      })}
      onFocus={composeHandler<FilledInputFocusArgs>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:FilledInput",
        eventFactory: () => ({
          type: "ui.filled_input.focus",
          action: "focus",
          component: "FilledInput"
        })
      })}
      onBlur={composeHandler<FilledInputBlurArgs>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:FilledInput",
        eventFactory: () => ({
          type: "ui.filled_input.blur",
          action: "blur",
          component: "FilledInput"
        })
      })}
    />
  );
}

export const FilledInput = preserveComponentType(
  forwardRef(FilledInputImpl) as unknown as typeof MuiFilledInput,
  MuiFilledInput
);
export default FilledInput;
