"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import type { AutocompleteChangeReason, AutocompleteProps } from "@mui/material/Autocomplete";
import MuiAutocomplete from "@mui/material/Autocomplete";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";

type AutocompleteRef = ComponentPropsWithRef<typeof MuiAutocomplete>["ref"];

type AutocompleteChangeArgs<
  TValue,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
> = Parameters<NonNullable<AutocompleteProps<TValue, Multiple, DisableClearable, FreeSolo>["onChange"]>>;

function hasAutocompleteValue(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.length > 0;
  }
  return input !== null && input !== undefined;
}

function AutocompleteImpl<
  TValue,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
>(
  inProps: AutocompleteProps<TValue, Multiple, DisableClearable, FreeSolo>,
  ref: AutocompleteRef
) {
  const emit = useEmitUIEvent();
  const { onChange, ...props } = inProps;

  return (
    <MuiAutocomplete
      {...props}
      ref={ref}
      onChange={composeHandler<AutocompleteChangeArgs<TValue, Multiple, DisableClearable, FreeSolo>>({
        userHandler: onChange,
        emit,
        dedupeKey: "change:Autocomplete",
        eventFactory: (_event, value, reason: AutocompleteChangeReason) => ({
          type: "ui.autocomplete.change",
          action: "change",
          component: "Autocomplete",
          metadata: {
            reason,
            hasValue: hasAutocompleteValue(value)
          }
        })
      })}
    />
  );
}

export const Autocomplete = preserveComponentType(forwardRef(AutocompleteImpl) as unknown as typeof MuiAutocomplete, MuiAutocomplete);
export default Autocomplete;
