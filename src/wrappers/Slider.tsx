"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiSlider from "@mui/material/Slider";
import type { SliderProps } from "@mui/material/Slider";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type SliderRef = ComponentPropsWithRef<typeof MuiSlider>["ref"];
type SliderCommittedArgs = Parameters<NonNullable<SliderProps["onChangeCommitted"]>>;

function SliderImpl(inProps: SliderProps, ref: SliderRef) {
  const emit = useEmitUIEvent();
  const { onChangeCommitted, ...props } = inProps;

  return (
    <MuiSlider
      {...props}
      ref={ref}
      onChangeCommitted={composeHandler<SliderCommittedArgs>({
        userHandler: onChangeCommitted,
        emit,
        dedupeKey: "change:Slider",
        eventFactory: (_, value) => ({
          type: "ui.slider.change",
          action: "commit",
          component: "Slider",
          metadata: {
            valueCount: Array.isArray(value) ? value.length : 1
          }
        })
      })}
    />
  );
}

export const Slider = preserveComponentType(forwardRef(SliderImpl) as unknown as typeof MuiSlider, MuiSlider);
export default Slider;
