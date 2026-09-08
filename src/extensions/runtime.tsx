"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import type {
  ExtensionDispatchContext,
  UIEvent,
  UIExtensionsConfig,
  UIExtensionsContextValue,
  UIExtensionsProviderProps,
  UIExtension
} from "./types.js";

const DEFAULT_CONFIG: UIExtensionsConfig = {
  enabled: false,
  debug: false
};

const UIExtensionsContext = createContext<UIExtensionsContextValue | null>(null);

function safeInvoke(extension: UIExtension, event: UIEvent, context: ExtensionDispatchContext): void {
  try {
    const outcome = extension.onEvent?.(event, context);
    if (outcome && typeof (outcome as Promise<void>).catch === "function") {
      (outcome as Promise<void>).catch(() => undefined);
    }
  } catch {
    // Extension failures must not break host interactions.
  }
}

export function UIExtensionsProvider({
  children,
  extensions = [],
  initialConfig
}: UIExtensionsProviderProps) {
  const extensionMapRef = useRef<Map<string, UIExtension>>(new Map());
  const configRef = useRef<UIExtensionsConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });

  if (extensionMapRef.current.size === 0 && extensions.length > 0) {
    for (const extension of extensions) {
      extensionMapRef.current.set(extension.id, extension);
    }
  }

  const api = useMemo<UIExtensionsContextValue>(
    () => ({
      emit: (inputEvent, context = {}) => {
        const currentConfig = configRef.current;
        if (!currentConfig.enabled) {
          return;
        }

        const event: UIEvent = {
          ...inputEvent,
          schemaVersion: "1.0.0",
          timestamp: Date.now()
        };

        const dispatchContext: ExtensionDispatchContext = {
          trackingPath: context.trackingPath ?? [],
          optedOut: context.optedOut ?? false
        };

        for (const extension of extensionMapRef.current.values()) {
          safeInvoke(extension, event, dispatchContext);
        }
      },
      register: (extension) => {
        extensionMapRef.current.set(extension.id, extension);
        return () => {
          extension.dispose?.();
          extensionMapRef.current.delete(extension.id);
        };
      },
      updateConfig: (next) => {
        configRef.current = {
          ...configRef.current,
          ...next
        };
      },
      getConfig: () => configRef.current
    }),
    []
  );

  return <UIExtensionsContext.Provider value={api}>{children}</UIExtensionsContext.Provider>;
}

export function useUIExtensions(): UIExtensionsContextValue {
  const ctx = useContext(UIExtensionsContext);
  if (!ctx) {
    throw new Error("useUIExtensions must be used inside UIExtensionsProvider");
  }
  return ctx;
}

export function useOptionalUIExtensions(): UIExtensionsContextValue | null {
  return useContext(UIExtensionsContext);
}
