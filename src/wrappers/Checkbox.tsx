"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiCheckbox from "@mui/material/Checkbox";
import type { CheckboxProps } from "@mui/material/Checkbox";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type CheckboxRef = ComponentPropsWithRef<typeof MuiCheckbox>["ref"];
type CheckboxChangeArgs = Parameters<NonNullable<CheckboxProps["onChange"]>>;
type CheckboxFocusArgs = Parameters<NonNullable<CheckboxProps["onFocus"]>>;
type CheckboxBlurArgs = Parameters<NonNullable<CheckboxProps["onBlur"]>>;

function CheckboxImpl(inProps: CheckboxProps, ref: CheckboxRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = useResolvedDefaultHandler<CheckboxProps["onChange"]>(
    theme,
    "MuiCheckbox",
    "onChange",
    onChange
  );
  const resolvedOnFocus = useResolvedDefaultHandler<CheckboxProps["onFocus"]>(theme, "MuiCheckbox", "onFocus", onFocus);
  const resolvedOnBlur = useResolvedDefaultHandler<CheckboxProps["onBlur"]>(theme, "MuiCheckbox", "onBlur", onBlur);

  return (
    <MuiCheckbox
      {...props}
      ref={ref}
      onChange={composeHandler<CheckboxChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:Checkbox",
        eventFactory: () => ({
          type: "ui.checkbox.change",
          action: "change",
          component: "Checkbox"
        })
      })}
      onFocus={composeHandler<CheckboxFocusArgs>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:Checkbox",
        eventFactory: () => ({
          type: "ui.checkbox.focus",
          action: "focus",
          component: "Checkbox"
        })
      })}
      onBlur={composeHandler<CheckboxBlurArgs>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:Checkbox",
        eventFactory: () => ({
          type: "ui.checkbox.blur",
          action: "blur",
          component: "Checkbox"
        })
      })}
    />
  );
}

export const Checkbox = preserveComponentType(forwardRef(CheckboxImpl) as unknown as typeof MuiCheckbox, MuiCheckbox);
export default Checkbox;
