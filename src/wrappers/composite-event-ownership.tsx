"use client";

import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";

type CompositeOwner = "Autocomplete";

const CompositeEventOwnershipContext = createContext<CompositeOwner | null>(null);

export function CompositeEventOwnershipProvider({
  owner,
  children
}: PropsWithChildren<{ owner: CompositeOwner }>) {
  return <CompositeEventOwnershipContext.Provider value={owner}>{children}</CompositeEventOwnershipContext.Provider>;
}

export function useIsCompositeEventOwnedBy(owner: CompositeOwner): boolean {
  return useContext(CompositeEventOwnershipContext) === owner;
}
