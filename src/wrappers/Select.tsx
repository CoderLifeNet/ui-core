"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import MuiSelect from "@mui/material/Select";
import type { SelectChangeEvent, SelectProps } from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type SelectRef = ComponentPropsWithRef<typeof MuiSelect>["ref"];

function SelectImpl<Value = unknown>(
  inProps: SelectProps<Value>,
  ref: SelectRef
) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = resolveThemeDefaultHandler<SelectProps<Value>["onChange"]>(
    theme,
    "MuiSelect",
    "onChange",
    onChange
  );
  const resolvedOnFocus = resolveThemeDefaultHandler<SelectProps<Value>["onFocus"]>(theme, "MuiSelect", "onFocus", onFocus);
  const resolvedOnBlur = resolveThemeDefaultHandler<SelectProps<Value>["onBlur"]>(theme, "MuiSelect", "onBlur", onBlur);

  return (
    <MuiSelect
      {...props}
      ref={ref}
      onChange={composeHandler<[SelectChangeEvent<Value>, ReactNode]>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:Select",
        eventFactory: () => ({
          type: "ui.select.change",
          action: "change",
          component: "Select"
        })
      })}
      onFocus={composeHandler<Parameters<NonNullable<SelectProps<Value>["onFocus"]>>>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:Select",
        eventFactory: () => ({
          type: "ui.select.focus",
          action: "focus",
          component: "Select"
        })
      })}
      onBlur={composeHandler<Parameters<NonNullable<SelectProps<Value>["onBlur"]>>>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:Select",
        eventFactory: () => ({
          type: "ui.select.blur",
          action: "blur",
          component: "Select"
        })
      })}
    />
  );
}

export const Select = preserveComponentType(forwardRef(SelectImpl) as unknown as typeof MuiSelect, MuiSelect);
export default Select;
