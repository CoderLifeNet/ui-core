"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiTab from "@mui/material/Tab";
import type { TabProps } from "@mui/material/Tab";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type TabRef = ComponentPropsWithRef<typeof MuiTab>["ref"];
type TabClickArgs = Parameters<NonNullable<TabProps["onClick"]>>;

function TabImpl(inProps: TabProps, ref: TabRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onClick, ...props } = inProps;
  const resolvedOnClick = useResolvedDefaultHandler<TabProps["onClick"]>(theme, "MuiTab", "onClick", onClick);

  return (
    <MuiTab
      {...props}
      ref={ref}
      onClick={composeHandler<TabClickArgs>({
        userHandler: resolvedOnClick,
        emit,
        dedupeKey: "click:Tab",
        eventFactory: () => ({
          type: "ui.tab.click",
          action: "select",
          component: "Tab"
        })
      })}
    />
  );
}

export const Tab = preserveComponentType(forwardRef(TabImpl) as unknown as typeof MuiTab, MuiTab);
export default Tab;
