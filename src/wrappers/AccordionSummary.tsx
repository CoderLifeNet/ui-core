"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import type { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type AccordionSummaryRef = ComponentPropsWithRef<typeof MuiAccordionSummary>["ref"];
type AccordionSummaryClickArgs = Parameters<NonNullable<AccordionSummaryProps["onClick"]>>;

function AccordionSummaryImpl(
  inProps: AccordionSummaryProps,
  ref: AccordionSummaryRef
) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onClick, ...props } = inProps;
  const resolvedOnClick = useResolvedDefaultHandler<AccordionSummaryProps["onClick"]>(
    theme,
    "MuiAccordionSummary",
    "onClick",
    onClick
  );

  return (
    <MuiAccordionSummary
      {...props}
      ref={ref}
      onClick={composeHandler<AccordionSummaryClickArgs>({
        userHandler: resolvedOnClick,
        emit,
        dedupeKey: "click:AccordionSummary",
        eventFactory: () => ({
          type: "ui.accordion.toggle",
          action: "toggle",
          component: "AccordionSummary"
        })
      })}
    />
  );
}

export const AccordionSummary = preserveComponentType(
  forwardRef(AccordionSummaryImpl) as unknown as typeof MuiAccordionSummary,
  MuiAccordionSummary
);
export default AccordionSummary;
