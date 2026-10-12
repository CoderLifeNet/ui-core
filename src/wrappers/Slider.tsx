"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiSlider from "@mui/material/Slider";
import type { SliderProps } from "@mui/material/Slider";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type SliderRef = ComponentPropsWithRef<typeof MuiSlider>["ref"];
type SliderCommittedArgs = Parameters<NonNullable<SliderProps["onChangeCommitted"]>>;

function SliderImpl(inProps: SliderProps, ref: SliderRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChangeCommitted, ...props } = inProps;
  const resolvedOnChangeCommitted = useResolvedDefaultHandler<SliderProps["onChangeCommitted"]>(
    theme,
    "MuiSlider",
    "onChangeCommitted",
    onChangeCommitted
  );

  return (
    <MuiSlider
      {...props}
      ref={ref}
      onChangeCommitted={composeHandler<SliderCommittedArgs>({
        userHandler: resolvedOnChangeCommitted,
        emit,
        dedupeKey: "change:Slider",
        eventFactory: () => ({
          type: "ui.slider.change",
          action: "commit",
          component: "Slider"
        })
      })}
    />
  );
}

export const Slider = preserveComponentType(forwardRef(SliderImpl) as unknown as typeof MuiSlider, MuiSlider);
export default Slider;
