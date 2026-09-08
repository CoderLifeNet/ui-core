"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiTabs from "@mui/material/Tabs";
import type { TabsProps } from "@mui/material/Tabs";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type TabsRef = ComponentPropsWithRef<typeof MuiTabs>["ref"];
type TabsChangeArgs = Parameters<NonNullable<TabsProps["onChange"]>>;

function TabsImpl(inProps: TabsProps, ref: TabsRef) {
  const emit = useEmitUIEvent();
  const { onChange, ...props } = inProps;

  return (
    <MuiTabs
      {...props}
      ref={ref}
      onChange={composeHandler<TabsChangeArgs>({
        userHandler: onChange,
        emit,
        dedupeKey: "change:Tabs",
        eventFactory: (_, value) => ({
          type: "ui.tabs.change",
          action: "change",
          component: "Tabs",
          metadata: { hasValue: value !== undefined }
        })
      })}
    />
  );
}

export const Tabs = preserveComponentType(forwardRef(TabsImpl) as unknown as typeof MuiTabs, MuiTabs);
export default Tabs;
