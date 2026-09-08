"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiIconButton from "@mui/material/IconButton";
import type { IconButtonProps } from "@mui/material/IconButton";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type IconButtonRef = ComponentPropsWithRef<typeof MuiIconButton>["ref"];
type IconButtonClickArgs = Parameters<NonNullable<IconButtonProps["onClick"]>>;

function IconButtonImpl(inProps: IconButtonProps, ref: IconButtonRef) {
  const emit = useEmitUIEvent();
  const { onClick, ...props } = inProps;

  return (
    <MuiIconButton
      {...props}
      ref={ref}
      onClick={composeHandler<IconButtonClickArgs>({
        userHandler: onClick,
        emit,
        dedupeKey: "click:IconButton",
        eventFactory: () => ({
          type: "ui.icon_button.click",
          action: "click",
          component: "IconButton",
          metadata: {
            color: inProps.color ?? "default",
            size: inProps.size ?? "medium"
          }
        })
      })}
    />
  );
}

export const IconButton = preserveComponentType(forwardRef(IconButtonImpl) as unknown as typeof MuiIconButton, MuiIconButton);
export default IconButton;
