"use client";

import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";
import type { AutocompleteChangeReason, AutocompleteProps } from "@mui/material/Autocomplete";
import MuiAutocomplete from "@mui/material/Autocomplete";
import { useTheme } from "@mui/material/styles";
import { composeHandler } from "../instrumentation/compose-handler.js";
import { useEmitUIEvent } from "../instrumentation/emit.js";
import { preserveComponentType } from "./preserve-component-type.js";
import { resolveThemeDefaultHandler } from "./resolve-theme-default-handler.js";

type AutocompleteRef = ComponentPropsWithRef<typeof MuiAutocomplete>["ref"];

type AutocompleteChangeArgs<
  TValue,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
> = Parameters<NonNullable<AutocompleteProps<TValue, Multiple, DisableClearable, FreeSolo>["onChange"]>>;

type AutocompleteFocusArgs<
  TValue,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
> = Parameters<NonNullable<AutocompleteProps<TValue, Multiple, DisableClearable, FreeSolo>["onFocus"]>>;

type AutocompleteBlurArgs<
  TValue,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
> = Parameters<NonNullable<AutocompleteProps<TValue, Multiple, DisableClearable, FreeSolo>["onBlur"]>>;

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
  const theme = useTheme();
  const { onChange, onFocus, onBlur, ...props } = inProps;
  const resolvedOnChange = resolveThemeDefaultHandler<AutocompleteProps<TValue, Multiple, DisableClearable, FreeSolo>["onChange"]>(
    theme,
    "MuiAutocomplete",
    "onChange",
    onChange
  );
  const resolvedOnFocus = resolveThemeDefaultHandler<AutocompleteProps<TValue, Multiple, DisableClearable, FreeSolo>["onFocus"]>(
    theme,
    "MuiAutocomplete",
    "onFocus",
    onFocus
  );
  const resolvedOnBlur = resolveThemeDefaultHandler<AutocompleteProps<TValue, Multiple, DisableClearable, FreeSolo>["onBlur"]>(
    theme,
    "MuiAutocomplete",
    "onBlur",
    onBlur
  );

  return (
    <MuiAutocomplete
      {...props}
      ref={ref}
      onChange={composeHandler<AutocompleteChangeArgs<TValue, Multiple, DisableClearable, FreeSolo>>({
        userHandler: resolvedOnChange,
        emit,
        dedupeKey: "change:Autocomplete",
        eventFactory: (_event, _value, reason: AutocompleteChangeReason) => ({
          type: "ui.autocomplete.change",
          action: "change",
          component: "Autocomplete",
          metadata: {
            reason
          }
        })
      })}
      onFocus={composeHandler<AutocompleteFocusArgs<TValue, Multiple, DisableClearable, FreeSolo>>({
        userHandler: resolvedOnFocus,
        emit,
        dedupeKey: "focus:Autocomplete",
        eventFactory: () => ({
          type: "ui.autocomplete.focus",
          action: "focus",
          component: "Autocomplete"
        })
      })}
      onBlur={composeHandler<AutocompleteBlurArgs<TValue, Multiple, DisableClearable, FreeSolo>>({
        userHandler: resolvedOnBlur,
        emit,
        dedupeKey: "blur:Autocomplete",
        eventFactory: () => ({
          type: "ui.autocomplete.blur",
          action: "blur",
          component: "Autocomplete"
        })
      })}
    />
  );
}

export const Autocomplete = preserveComponentType(forwardRef(AutocompleteImpl) as unknown as typeof MuiAutocomplete, MuiAutocomplete);
export default Autocomplete;
