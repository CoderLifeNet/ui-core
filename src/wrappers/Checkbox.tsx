"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiCheckbox from "@mui/material/Checkbox";
import type { CheckboxProps } from "@mui/material/Checkbox";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type CheckboxRef = ComponentPropsWithRef<typeof MuiCheckbox>["ref"];
type CheckboxChangeArgs = Parameters<NonNullable<CheckboxProps["onChange"]>>;

function CheckboxImpl(inProps: CheckboxProps, ref: CheckboxRef) {
  const emit = useEmitUIEvent();
  const { onChange, ...props } = inProps;

  return (
    <MuiCheckbox
      {...props}
      ref={ref}
      onChange={composeHandler<CheckboxChangeArgs>({
        userHandler: onChange,
        emit,
        dedupeKey: "change:Checkbox",
        eventFactory: (_, checked) => ({
          type: "ui.checkbox.change",
          action: "change",
          component: "Checkbox",
          metadata: { checked }
        })
      })}
    />
  );
}

export const Checkbox = preserveComponentType(forwardRef(CheckboxImpl) as unknown as typeof MuiCheckbox, MuiCheckbox);
export default Checkbox;
