"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiRadio from "@mui/material/Radio";
import type { RadioProps } from "@mui/material/Radio";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type RadioRef = ComponentPropsWithRef<typeof MuiRadio>["ref"];
type RadioChangeArgs = Parameters<NonNullable<RadioProps["onChange"]>>;
type RadioFocusArgs = Parameters<NonNullable<RadioProps["onFocus"]>>;
type RadioBlurArgs = Parameters<NonNullable<RadioProps["onBlur"]>>;

function RadioImpl(inProps: RadioProps, ref: RadioRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = useResolvedDefaultHandler<RadioProps["onChange"]>(theme, "MuiRadio", "onChange", onChange);
  const resolvedOnFocus = useResolvedDefaultHandler<RadioProps["onFocus"]>(theme, "MuiRadio", "onFocus", onFocus);
  const resolvedOnBlur = useResolvedDefaultHandler<RadioProps["onBlur"]>(theme, "MuiRadio", "onBlur", onBlur);

  return (
    <MuiRadio
      {...props}
      ref={ref}
      onChange={composeHandler<RadioChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:Radio",
        eventFactory: () => ({
          type: "ui.radio.change",
          action: "change",
          component: "Radio"
        })
      })}
      onFocus={composeHandler<RadioFocusArgs>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:Radio",
        eventFactory: () => ({
          type: "ui.radio.focus",
          action: "focus",
          component: "Radio"
        })
      })}
      onBlur={composeHandler<RadioBlurArgs>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:Radio",
        eventFactory: () => ({
          type: "ui.radio.blur",
          action: "blur",
          component: "Radio"
        })
      })}
    />
  );
}

export const Radio = preserveComponentType(forwardRef(RadioImpl) as unknown as typeof MuiRadio, MuiRadio);
export default Radio;
