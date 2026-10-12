"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import MuiPagination from "@mui/material/Pagination";
import type { PaginationProps } from "@mui/material/Pagination";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { useResolvedDefaultHandler } from "./resolve-theme-default-handler.js";

type PaginationRef = ComponentPropsWithRef<typeof MuiPagination>["ref"];
type PaginationChangeArgs = Parameters<NonNullable<PaginationProps["onChange"]>>;

function PaginationImpl(inProps: PaginationProps, ref: PaginationRef) {
  const emit = useEmitUIEvent();
  const theme = useTheme();
  const { onChange, ...props } = inProps;
  const resolvedOnChange = useResolvedDefaultHandler<PaginationProps["onChange"]>(
    theme,
    "MuiPagination",
    "onChange",
    onChange
  );

  return (
    <MuiPagination
      {...props}
      ref={ref}
      onChange={composeHandler<PaginationChangeArgs>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:Pagination",
        eventFactory: (_, page) => ({
          type: "ui.pagination.change",
          action: "paginate",
          component: "Pagination",
          metadata: { page }
        })
      })}
    />
  );
}

export const Pagination = preserveComponentType(forwardRef(PaginationImpl) as unknown as typeof MuiPagination, MuiPagination);
export default Pagination;
