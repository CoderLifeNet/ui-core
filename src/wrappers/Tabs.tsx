"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiTabs from "@mui/material/Tabs";
import type { TabsProps } from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type TabsRef = ComponentPropsWithRef<typeof MuiTabs>["ref"];
type TabsChangeArgs = Parameters<NonNullable<TabsProps["onChange"]>>;

function TabsImpl(inProps: TabsProps, ref: TabsRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, ...props } = inProps;
  const resolvedOnChange = resolveThemeDefaultHandler<TabsProps["onChange"]>(theme, "MuiTabs", "onChange", onChange);

  return (
    <MuiTabs
      {...props}
      ref={ref}
      onChange={composeHandler<TabsChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:Tabs",
        eventFactory: () => ({
          type: "ui.tabs.change",
          action: "change",
          component: "Tabs"
        })
      })}
    />
  );
}

export const Tabs = preserveComponentType(forwardRef(TabsImpl) as unknown as typeof MuiTabs, MuiTabs);
export default Tabs;
