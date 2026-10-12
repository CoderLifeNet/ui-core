"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiLink from "@mui/material/Link";
import type { LinkProps } from "@mui/material/Link";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type LinkRef = ComponentPropsWithRef<typeof MuiLink>["ref"];
type LinkClickArgs = Parameters<NonNullable<LinkProps["onClick"]>>;

function LinkImpl(inProps: LinkProps, ref: LinkRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onClick, ...props } = inProps;
  const resolvedOnClick = resolveThemeDefaultHandler<LinkProps["onClick"]>(theme, "MuiLink", "onClick", onClick);

  return (
    <MuiLink
      {...props}
      ref={ref}
      onClick={composeHandler<LinkClickArgs>({
        userHandler: resolvedOnClick,
        emit,
        dedupeKey: "click:Link",
        eventFactory: () => ({
          type: "ui.link.click",
          action: "click",
          component: "Link",
          metadata: {
            underline: inProps.underline ?? "always"
          }
        })
      })}
    />
  );
}

export const Link = preserveComponentType(forwardRef(LinkImpl) as unknown as typeof MuiLink, MuiLink);
export default Link;
