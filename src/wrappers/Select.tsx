"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import MuiSelect from "@mui/material/Select";
import type { SelectChangeEvent, SelectProps } from "@mui/material/Select";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type SelectRef = ComponentPropsWithRef<typeof MuiSelect>["ref"];

function SelectImpl<Value = unknown>(
  inProps: SelectProps<Value>,
  ref: SelectRef
) {
  const emit = useEmitUIEvent();
  const { onChange, ...props } = inProps;

  return (
    <MuiSelect
      {...props}
      ref={ref}
      onChange={composeHandler<[SelectChangeEvent<Value>, ReactNode]>({
        userHandler: onChange,
        emit,
        dedupeKey: "change:Select",
        eventFactory: () => ({
          type: "ui.select.change",
          action: "change",
          component: "Select"
        })
      })}
    />
  );
}

export const Select = preserveComponentType(forwardRef(SelectImpl) as unknown as typeof MuiSelect, MuiSelect);
export default Select;
