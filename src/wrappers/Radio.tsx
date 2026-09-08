"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiRadio from "@mui/material/Radio";
import type { RadioProps } from "@mui/material/Radio";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type RadioRef = ComponentPropsWithRef<typeof MuiRadio>["ref"];
type RadioChangeArgs = Parameters<NonNullable<RadioProps["onChange"]>>;

function RadioImpl(inProps: RadioProps, ref: RadioRef) {
  const emit = useEmitUIEvent();
  const { onChange, ...props } = inProps;

  return (
    <MuiRadio
      {...props}
      ref={ref}
      onChange={composeHandler<RadioChangeArgs>({
        userHandler: onChange,
        emit,
        dedupeKey: "change:Radio",
        eventFactory: (_, checked) => ({
          type: "ui.radio.change",
          action: "change",
          component: "Radio",
          metadata: { checked }
        })
      })}
    />
  );
}

export const Radio = preserveComponentType(forwardRef(RadioImpl) as unknown as typeof MuiRadio, MuiRadio);
export default Radio;
