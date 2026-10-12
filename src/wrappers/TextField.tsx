"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiTextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type TextFieldRef = ComponentPropsWithRef<typeof MuiTextField>["ref"];
type TextFieldChangeArgs = Parameters<NonNullable<TextFieldProps["onChange"]>>;
type TextFieldFocusArgs = Parameters<NonNullable<TextFieldProps["onFocus"]>>;
type TextFieldBlurArgs = Parameters<NonNullable<TextFieldProps["onBlur"]>>;

function TextFieldImpl(inProps: TextFieldProps, ref: TextFieldRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = resolveThemeDefaultHandler<TextFieldProps["onChange"]>(
    theme,
    "MuiTextField",
    "onChange",
    onChange
  );
  const resolvedOnFocus = resolveThemeDefaultHandler<TextFieldProps["onFocus"]>(theme, "MuiTextField", "onFocus", onFocus);
  const resolvedOnBlur = resolveThemeDefaultHandler<TextFieldProps["onBlur"]>(theme, "MuiTextField", "onBlur", onBlur);

  const ownsSelectEvents = Boolean(inProps.select);

  return (
    <MuiTextField
      {...props}
      ref={ref}
      onChange={
        composeHandler<TextFieldChangeArgs>({
          userHandler: resolvedOnChange,
          emit,
          dedupeKey: ownsSelectEvents ? "change:Select" : "change:TextField",
          eventFactory: () => ({
            type: ownsSelectEvents ? "ui.select.change" : "ui.text_field.change",
            action: "change",
            component: ownsSelectEvents ? "Select" : "TextField"
          })
        })
      }
      onFocus={
        composeHandler<TextFieldFocusArgs>({
          userHandler: resolvedOnFocus,
          emit,
          dedupeKey: ownsSelectEvents ? "focus:Select" : "focus:TextField",
          eventFactory: () => ({
            type: ownsSelectEvents ? "ui.select.focus" : "ui.text_field.focus",
            action: "focus",
            component: ownsSelectEvents ? "Select" : "TextField"
          })
        })
      }
      onBlur={
        composeHandler<TextFieldBlurArgs>({
          userHandler: resolvedOnBlur,
          emit,
          dedupeKey: ownsSelectEvents ? "blur:Select" : "blur:TextField",
          eventFactory: () => ({
            type: ownsSelectEvents ? "ui.select.blur" : "ui.text_field.blur",
            action: "blur",
            component: ownsSelectEvents ? "Select" : "TextField"
          })
        })
      }
    />
  );
}

export const TextField = preserveComponentType(forwardRef(TextFieldImpl) as unknown as typeof MuiTextField, MuiTextField);
export default TextField;
