interface WithMuiName {
  muiName?: string | undefined;
}

// Audited cast used to preserve exact upstream component call signatures.
export function preserveComponentType<T>(
  candidate: T,
  original: unknown
): T {
  const source = original as WithMuiName;
  const namedCandidate = candidate as unknown as WithMuiName;
  if (source.muiName !== undefined) {
    namedCandidate.muiName = source.muiName;
  }
  return candidate;
}
