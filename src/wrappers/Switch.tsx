"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiSwitch from "@mui/material/Switch";
import type { SwitchProps } from "@mui/material/Switch";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type SwitchRef = ComponentPropsWithRef<typeof MuiSwitch>["ref"];
type SwitchChangeArgs = Parameters<NonNullable<SwitchProps["onChange"]>>;

function SwitchImpl(inProps: SwitchProps, ref: SwitchRef) {
  const emit = useEmitUIEvent();
  const { onChange, ...props } = inProps;

  return (
    <MuiSwitch
      {...props}
      ref={ref}
      onChange={composeHandler<SwitchChangeArgs>({
        userHandler: onChange,
        emit,
        dedupeKey: "change:Switch",
        eventFactory: (_, checked) => ({
          type: "ui.switch.change",
          action: "change",
          component: "Switch",
          metadata: { checked }
        })
      })}
    />
  );
}

export const Switch = preserveComponentType(forwardRef(SwitchImpl) as unknown as typeof MuiSwitch, MuiSwitch);
export default Switch;
