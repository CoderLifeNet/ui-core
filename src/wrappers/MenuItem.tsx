"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiMenuItem from "@mui/material/MenuItem";
import type { MenuItemProps } from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type MenuItemRef = ComponentPropsWithRef<typeof MuiMenuItem>["ref"];
type MenuItemClickArgs = Parameters<NonNullable<MenuItemProps["onClick"]>>;

function MenuItemImpl(inProps: MenuItemProps, ref: MenuItemRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onClick, ...props } = inProps;
  const resolvedOnClick = resolveThemeDefaultHandler<MenuItemProps["onClick"]>(theme, "MuiMenuItem", "onClick", onClick);

  return (
    <MuiMenuItem
      {...props}
      ref={ref}
      onClick={composeHandler<MenuItemClickArgs>({
        userHandler: resolvedOnClick,
        emit,
        dedupeKey: "click:MenuItem",
        eventFactory: () => ({
          type: "ui.menu_item.click",
          action: "select",
          component: "MenuItem"
        })
      })}
    />
  );
}

export const MenuItem = preserveComponentType(forwardRef(MenuItemImpl) as unknown as typeof MuiMenuItem, MuiMenuItem);
export default MenuItem;
