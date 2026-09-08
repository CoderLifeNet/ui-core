"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiLink from "@mui/material/Link";
import type { LinkProps } from "@mui/material/Link";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type LinkRef = ComponentPropsWithRef<typeof MuiLink>["ref"];
type LinkClickArgs = Parameters<NonNullable<LinkProps["onClick"]>>;

function LinkImpl(inProps: LinkProps, ref: LinkRef) {
  const emit = useEmitUIEvent();
  const { onClick, ...props } = inProps;

  return (
    <MuiLink
      {...props}
      ref={ref}
      onClick={composeHandler<LinkClickArgs>({
        userHandler: onClick,
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
