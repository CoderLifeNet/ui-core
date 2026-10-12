"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiNativeSelect from "@mui/material/NativeSelect";
import type { NativeSelectProps } from "@mui/material/NativeSelect";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type NativeSelectRef = ComponentPropsWithRef<typeof MuiNativeSelect>["ref"];
type NativeSelectChangeArgs = Parameters<NonNullable<NativeSelectProps["onChange"]>>;
type NativeSelectFocusArgs = Parameters<NonNullable<NativeSelectProps["onFocus"]>>;
type NativeSelectBlurArgs = Parameters<NonNullable<NativeSelectProps["onBlur"]>>;

function NativeSelectImpl(inProps: NativeSelectProps, ref: NativeSelectRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = useResolvedDefaultHandler<NativeSelectProps["onChange"]>(
    theme,
    "MuiNativeSelect",
    "onChange",
    onChange
  );
  const resolvedOnFocus = useResolvedDefaultHandler<NativeSelectProps["onFocus"]>(
    theme,
    "MuiNativeSelect",
    "onFocus",
    onFocus
  );
  const resolvedOnBlur = useResolvedDefaultHandler<NativeSelectProps["onBlur"]>(
    theme,
    "MuiNativeSelect",
    "onBlur",
    onBlur
  );

  return (
    <MuiNativeSelect
      {...props}
      ref={ref}
      onChange={composeHandler<NativeSelectChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:NativeSelect",
        eventFactory: () => ({
          type: "ui.native_select.change",
          action: "change",
          component: "NativeSelect"
        })
      })}
      onFocus={composeHandler<NativeSelectFocusArgs>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:NativeSelect",
        eventFactory: () => ({
          type: "ui.native_select.focus",
          action: "focus",
          component: "NativeSelect"
        })
      })}
      onBlur={composeHandler<NativeSelectBlurArgs>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:NativeSelect",
        eventFactory: () => ({
          type: "ui.native_select.blur",
          action: "blur",
          component: "NativeSelect"
        })
      })}
    />
  );
}

export const NativeSelect = preserveComponentType(
  forwardRef(NativeSelectImpl) as unknown as typeof MuiNativeSelect,
  MuiNativeSelect
);
export default NativeSelect;
